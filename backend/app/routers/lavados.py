from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
import asyncio
from app.database import get_db
from app.routers.auth import get_lavadero_actual
from app.models.schemas import LavadoCrear, LavadoRespuesta
from typing import List, Optional
import json

router = APIRouter()

def parse_lavado(fila: dict) -> dict:
    """Convierte los campos JSONB (devueltos como str por asyncpg) a listas Python."""
    d = dict(fila)
    for campo in ("adicionales_aplicados", "etiquetas_estado"):
        val = d.get(campo)
        if isinstance(val, str):
            try:
                d[campo] = json.loads(val)
            except (ValueError, TypeError):
                d[campo] = []
        elif val is None:
            d[campo] = []
    return d

async def procesar_consumo_inventario(db, lavadero_id: int, lavado: dict):
    """Busca las recetas del lavado y descuenta los productos del inventario."""
    # 1. Receta Base (por tipo de vehículo o subcategoría)
    nombres_buscar = [lavado["tipo_vehiculo"]]
    if lavado.get("subcategoria"):
        nombres_buscar.append(lavado["subcategoria"])

    recetas_base = await db.fetch(
        "SELECT producto_id, cantidad FROM recetas WHERE lavadero_id = $1 AND tipo_servicio = 'base' AND LOWER(nombre_servicio) = ANY($2::text[])",
        lavadero_id, [n.lower() for n in nombres_buscar]
    )
    
    # 2. Recetas Adicionales
    recetas_adicionales = []
    adicionales = lavado.get("adicionales_aplicados")
    if isinstance(adicionales, str):
        try: adicionales = json.loads(adicionales)
        except: adicionales = []
    
    if adicionales is None:
        adicionales = []
        
    for adic in adicionales:
        nombre_adic = adic.get("nombre", "")
        rs = await db.fetch(
            "SELECT producto_id, cantidad FROM recetas WHERE lavadero_id = $1 AND tipo_servicio = 'adicional' AND LOWER(nombre_servicio) = LOWER($2)",
            lavadero_id, nombre_adic
        )
        recetas_adicionales.extend(rs)
        
    # 3. Aplicar multiplicador del tipo de lavado a la receta base
    factores_nivel = {
        'sencillo': 1.0,
        'general': 1.5,
        'polichado': 2.0
    }
    nivel = lavado.get("nivel_suciedad", "sencillo")
    factor = factores_nivel.get(nivel, 1.0)

    recetas_base_procesadas = []
    for r in recetas_base:
        rd = dict(r)
        rd["cantidad"] = float(rd["cantidad"]) * factor
        recetas_base_procesadas.append(rd)

    recetas_adic_procesadas = [dict(r) for r in recetas_adicionales]
    
    todas_las_recetas = recetas_base_procesadas + recetas_adic_procesadas
    
    # Descontar cada producto
    for r in todas_las_recetas:
        p_id = r["producto_id"]
        cant_consumir = float(r["cantidad"])
        
        # Obtener stock actual
        prod = await db.fetchrow("SELECT cantidad FROM inventario WHERE id = $1", p_id)
        if prod:
            nuevo_stock = max(0, float(prod["cantidad"]) - cant_consumir)
            await db.execute("UPDATE inventario SET cantidad = $1 WHERE id = $2", nuevo_stock, p_id)
            
            # Registrar movimiento
            motivo = f"{lavado['tipo_vehiculo'].upper()} - {lavado['placa']}"
            await db.execute(
                "INSERT INTO movimientos_inventario (lavadero_id, producto_id, tipo, cantidad, motivo) VALUES ($1, $2, 'consumo', $3, $4)",
                lavadero_id, p_id, cant_consumir, motivo
            )

async def enviar_notificacion_whatsapp(telefono: str, placa: str, lavadero_nombre: str):
    """
    Simula el envío de una notificación por WhatsApp mediante un Webhook.
    """
    if not telefono or len(telefono) < 5:
        return
        
    print(f"🚀 [WEBHOOK] Iniciando envío de WhatsApp a {telefono} para placa {placa}...")
    await asyncio.sleep(2) # Simular latencia de red
    
    # Aquí iría un httpx.post("https://api.twilio.com/...", json={...})
    print(f"✅ [WEBHOOK] Mensaje enviado a {telefono}: 'Hola, tu vehículo {placa} ya está terminado en {lavadero_nombre}. ¡Te esperamos!'")

@router.post("/", response_model=LavadoRespuesta, status_code=201)
async def registrar_lavado(
    datos: LavadoCrear,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """
    Registra un nuevo lavado.
    Calcula el precio base según el tipo de vehículo
    y lo guarda como valor histórico fijo.
    Primero busca en vehiculos_catalogo (dinámico),
    si no existe cae al campo precio_{tipo} de lavaderos.
    """
    # 0. Verificar que la caja de hoy no esté cerrada
    caja_cerrada = await db.fetchval("SELECT id FROM cierres_caja WHERE lavadero_id = $1 AND fecha_cierre = CURRENT_DATE", lavadero_id)
    if caja_cerrada:
        raise HTTPException(status_code=400, detail="La caja del día de hoy ya está cerrada. No se pueden registrar más lavados.")

    # 1. Buscar en el catálogo dinámico de vehículos
    precio_catalogo_row = await db.fetchrow(
        """
        SELECT precio, subcategorias FROM vehiculos_catalogo
        WHERE lavadero_id = $1
          AND LOWER(nombre) = LOWER($2)
          AND activo = TRUE
        LIMIT 1
        """,
        lavadero_id, datos.tipo_vehiculo
    )

    sub_extra = 0
    if precio_catalogo_row is not None:
        precio_base = precio_catalogo_row["precio"]
        subs_val = precio_catalogo_row["subcategorias"]
        if isinstance(subs_val, str):
            try:
                subs = json.loads(subs_val)
            except Exception:
                subs = []
        else:
            subs = subs_val or []
            
        sub_l = (datos.subcategoria or "").lower()
        for s in subs:
            if s.get("nombre", "").lower() == sub_l:
                sub_extra = s.get("precio_extra", 0)
                break
    else:
        # 2. Fallback: columnas estáticas en lavaderos (moto/carro/furgon/camion/bus)
        tipos_validos = {"moto", "carro", "furgon", "camion", "bus"}
        tipo_norm = datos.tipo_vehiculo.lower()
        if tipo_norm not in tipos_validos:
            raise HTTPException(
                status_code=422,
                detail=f"Tipo de vehículo '{datos.tipo_vehiculo}' no encontrado en el catálogo"
            )
        fila_precio = await db.fetchrow(
            f"SELECT precio_{tipo_norm} AS precio_base FROM lavaderos WHERE id = $1",
            lavadero_id
        )
        if not fila_precio:
            raise HTTPException(status_code=404, detail="Lavadero no encontrado")
        precio_base = fila_precio["precio_base"]

    precio_adicionales = sum(a.precio for a in datos.adicionales_aplicados)
    
    factores = {"ligero": 1.0, "medio": 1.3, "profundo": 1.6}
    niv_l = (datos.nivel_suciedad or "ligero").lower()
    factor = factores.get(niv_l, 1.0)
    
    precio_total = round((precio_base + sub_extra) * factor) + precio_adicionales

    # Serializar listas a JSON para guardar en JSONB
    adicionales_json   = json.dumps([a.dict() for a in datos.adicionales_aplicados])
    etiquetas_json     = json.dumps(datos.etiquetas_estado)

    fila = await db.fetchrow(
        """
        INSERT INTO lavados (
            lavadero_id, empleado_id, placa, tipo_vehiculo,
            hora_ingreso, precio_base, precio_adicionales, precio_total,
            adicionales_aplicados, etiquetas_estado, nota,
            subcategoria, nivel_suciedad, cliente_nombre, cliente_telefono, metodo_pago
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12,$13,$14,$15,$16)
        RETURNING *
        """,
        lavadero_id, datos.empleado_id, datos.placa.upper(),
        datos.tipo_vehiculo, datos.hora_ingreso,
        precio_base, precio_adicionales, precio_total,
        adicionales_json, etiquetas_json, datos.nota,
        datos.subcategoria, datos.nivel_suciedad,
        datos.cliente_nombre, datos.cliente_telefono, datos.metodo_pago
    )
    return parse_lavado(fila)


@router.get("/", response_model=List[LavadoRespuesta])
async def listar_lavados(
    periodo: str        = Query("hoy", enum=["hoy","semana","mes","todo"]),
    tipo:    Optional[str] = Query(None),
    buscar:  Optional[str] = Query(None),
    estado:  Optional[str] = Query(None),
    pagina:  int           = Query(1, ge=1),
    limite:  int           = Query(50, ge=1, le=200),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """
    Devuelve el historial con filtros opcionales.
    Paginado para no traer miles de registros de golpe.
    """
    # Construir filtro de fecha según período
    filtros = {"hoy": "l.fecha = CURRENT_DATE",
               "semana": "l.fecha >= CURRENT_DATE - INTERVAL '7 days'",
               "mes": "l.fecha >= date_trunc('month', CURRENT_DATE)",
               "todo": "TRUE"}
    filtro_fecha = filtros[periodo]

    filtro_tipo   = f"AND l.tipo_vehiculo = '{tipo}'" if tipo else ""
    filtro_buscar = f"AND (l.placa ILIKE '%{buscar}%')" if buscar else ""
    filtro_estado = f"AND l.estado_actual = '{estado}'" if estado else ""
    offset        = (pagina - 1) * limite

    filas = await db.fetch(
        f"""
        SELECT l.*, e.nombre AS empleado_nombre FROM lavados l
        LEFT JOIN empleados e ON l.empleado_id = e.id
        WHERE l.lavadero_id = $1
          AND {filtro_fecha}
          {filtro_tipo}
          {filtro_buscar}
          {filtro_estado}
        ORDER BY l.fecha DESC, l.hora_ingreso DESC
        LIMIT $2 OFFSET $3
        """,
        lavadero_id, limite, offset
    )
    return [parse_lavado(f) for f in filas]


@router.get("/sugerencias-placa")
async def sugerencias_placa(
    q: str = Query(..., min_length=1),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """
    Devuelve hasta 8 placas que coincidan parcialmente con 'q'.
    Incluye los datos del último lavado de cada placa para el autocompletado.
    """
    filas = await db.fetch(
        """
        SELECT DISTINCT ON (placa)
               placa, tipo_vehiculo, subcategoria,
               cliente_nombre, cliente_telefono
        FROM lavados
        WHERE lavadero_id = $1
          AND UPPER(placa) LIKE UPPER($2)
        ORDER BY placa, fecha DESC, hora_ingreso DESC
        LIMIT 8
        """,
        lavadero_id, f"{q.strip().upper()}%"
    )
    return [dict(f) for f in filas]


@router.get("/placa/{placa}")
async def buscar_por_placa(
    placa: str,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """
    Devuelve los datos más recientes de una placa para pre-llenar el formulario de registro.
    Útil para autocompletar tipo de vehículo, nombre y teléfono del cliente.
    """
    fila = await db.fetchrow(
        """
        SELECT placa, tipo_vehiculo, subcategoria, nivel_suciedad,
               cliente_nombre, cliente_telefono, empleado_id
        FROM lavados
        WHERE lavadero_id = $1
          AND UPPER(placa) = UPPER($2)
        ORDER BY fecha DESC, hora_ingreso DESC
        LIMIT 1
        """,
        lavadero_id, placa.strip()
    )
    if not fila:
        return None
    return dict(fila)


@router.get("/cliente/{placa}/visitas")
async def buscar_visitas_cliente(
    placa: str,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """
    Devuelve la cantidad de lavados 'terminados' o 'entregados' asociados a una placa.
    Útil para el plan de fidelización.
    """
    if not placa or len(placa.strip()) < 3:
        return {"visitas": 0}

    visitas = await db.fetchval(
        """
        SELECT COUNT(*)
        FROM lavados
        WHERE lavadero_id = $1
          AND UPPER(placa) = UPPER($2)
          AND estado_actual IN ('terminado', 'entregado')
        """,
        lavadero_id, placa.strip()
    )
    return {"visitas": visitas or 0}

from app.models.schemas import LavadoCrear, LavadoRespuesta, EstadoActualizar, LavadoActualizar


@router.patch("/{lavado_id}/estado", response_model=LavadoRespuesta)
async def actualizar_estado_lavado(
    lavado_id: int,
    datos: EstadoActualizar,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Actualiza el estado de un lavado y registra la hora local del cambio. Si se cancela, almacena el motivo."""
    fila_previa = await db.fetchrow(
        "SELECT l.id, l.fecha, l.estado_actual, l.placa, l.cliente_telefono, lav.nombre AS lavadero_nombre "
        "FROM lavados l JOIN lavaderos lav ON l.lavadero_id = lav.id "
        "WHERE l.id = $1 AND l.lavadero_id = $2", 
        lavado_id, lavadero_id
    )
    if not fila_previa:
        raise HTTPException(status_code=404, detail="Lavado no encontrado")
        
    caja_cerrada = await db.fetchval("SELECT id FROM cierres_caja WHERE lavadero_id = $1 AND fecha_cierre = $2", lavadero_id, fila_previa["fecha"])
    if caja_cerrada:
        raise HTTPException(status_code=400, detail="La caja de este día ya está cerrada. No se puede modificar el estado.")

    estados_validos = {"espera", "lavando", "terminado", "entregado", "cancelado"}
    if datos.estado not in estados_validos:
        raise HTTPException(status_code=422, detail="Estado no válido")

    if datos.estado == "cancelado":
        fila = await db.fetchrow(
            """
            UPDATE lavados 
            SET estado_actual = $1, 
                hora_cancelado = CURRENT_TIME, 
                motivo_cancelacion = $4,
                precio_base = 0,
                precio_adicionales = 0,
                precio_total = 0,
                adicionales_aplicados = '[]'::jsonb,
                subcategoria = NULL,
                nota = NULL,
                metodo_pago = NULL,
                empleado_id = NULL
            WHERE id = $2 AND lavadero_id = $3
            RETURNING *
            """,
            datos.estado, lavado_id, lavadero_id, datos.motivo_cancelacion
        )
    else:
        columna_tiempo = f"hora_{datos.estado}" if datos.estado != "espera" else None
        
        if columna_tiempo:
            query = f"""
                UPDATE lavados 
                SET estado_actual = $1, {columna_tiempo} = CURRENT_TIME
                WHERE id = $2 AND lavadero_id = $3
                RETURNING *
            """
        else:
            query = """
                UPDATE lavados 
                SET estado_actual = $1
                WHERE id = $2 AND lavadero_id = $3
                RETURNING *
            """
        fila = await db.fetchrow(query, datos.estado, lavado_id, lavadero_id)
        
    if not fila:
        raise HTTPException(status_code=404, detail="Lavado no encontrado")

    # Si el lavado pasó a "terminado" o "entregado" por primera vez, descontamos inventario
    estado_previo = fila_previa["estado_actual"]
    if datos.estado in ("terminado", "entregado") and estado_previo in ("espera", "lavando"):
        await procesar_consumo_inventario(db, lavadero_id, dict(fila))
        
    # Disparar webhook de WhatsApp en background si pasa a "terminado"
    if datos.estado == "terminado" and estado_previo != "terminado":
        telefono = fila_previa.get("cliente_telefono")
        if telefono:
            background_tasks.add_task(
                enviar_notificacion_whatsapp, 
                telefono, 
                fila_previa["placa"], 
                fila_previa["lavadero_nombre"]
            )
        
    return parse_lavado(fila)


@router.patch("/{lavado_id}", response_model=LavadoRespuesta)
async def editar_lavado_general(
    lavado_id: int,
    datos: LavadoActualizar,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Permite editar campos básicos del lavado y re-calcular el total."""
    fila_previa = await db.fetchrow("SELECT * FROM lavados WHERE id = $1 AND lavadero_id = $2", lavado_id, lavadero_id)
    if not fila_previa:
        raise HTTPException(status_code=404, detail="Lavado no encontrado")
        
    caja_cerrada = await db.fetchval("SELECT id FROM cierres_caja WHERE lavadero_id = $1 AND fecha_cierre = $2", lavadero_id, fila_previa["fecha"])
    if caja_cerrada:
        raise HTTPException(status_code=400, detail="La caja de este día ya está cerrada. No se puede editar el registro.")
    
    # Cargar valores actuales o reemplazarlos
    prev = parse_lavado(fila_previa)
    placa = datos.placa if datos.placa is not None else prev["placa"]
    tipo = datos.tipo_vehiculo if datos.tipo_vehiculo is not None else prev["tipo_vehiculo"]
    emp = datos.empleado_id if datos.empleado_id is not None else prev["empleado_id"]
    nota = datos.nota if datos.nota is not None else prev.get("nota")
    subcat = datos.subcategoria if datos.subcategoria is not None else prev.get("subcategoria")
    niv_suc = datos.nivel_suciedad if datos.nivel_suciedad is not None else prev.get("nivel_suciedad", "ligero")
    cli_nom = datos.cliente_nombre if datos.cliente_nombre is not None else prev.get("cliente_nombre")
    cli_tel = datos.cliente_telefono if datos.cliente_telefono is not None else prev.get("cliente_telefono")
    met_pag = datos.metodo_pago if datos.metodo_pago is not None else prev.get("metodo_pago", "efectivo")
    
    # JSON Adicionales
    if datos.adicionales_aplicados is not None:
        adics = [a.dict() for a in datos.adicionales_aplicados]
        precio_adicionales = sum(a["precio"] for a in adics)
    else:
        adics = prev["adicionales_aplicados"]
        precio_adicionales = prev["precio_adicionales"]
        
    adicionales_json = json.dumps(adics)
    
    # Recalcular Subtotal y Total basado en constantes
    sub_extra = 0
    precio_catalogo_row = await db.fetchrow(
        "SELECT precio, subcategorias FROM vehiculos_catalogo WHERE lavadero_id = $1 AND LOWER(nombre) = LOWER($2)",
        lavadero_id, tipo
    )
    if precio_catalogo_row:
        subs_val = precio_catalogo_row["subcategorias"]
        if isinstance(subs_val, str):
            try:
                subs = json.loads(subs_val)
            except Exception:
                subs = []
        else:
            subs = subs_val or []
            
        sub_l = (subcat or "").lower()
        for s in subs:
            if s.get("nombre", "").lower() == sub_l:
                sub_extra = s.get("precio_extra", 0)
                break

    factores = {"ligero": 1.0, "medio": 1.3, "profundo": 1.6}
    niv_l = (niv_suc or "ligero").lower()
    factor = factores.get(niv_l, 1.0)
    
    precio_total = round((prev["precio_base"] + sub_extra) * factor) + precio_adicionales
    
    update_q = """
        UPDATE lavados
        SET placa = $1, tipo_vehiculo = $2, empleado_id = $3,
            nota = $4, subcategoria = $5, nivel_suciedad = $6,
            cliente_nombre = $7, cliente_telefono = $8,
            adicionales_aplicados = $9::jsonb,
            precio_adicionales = $10, precio_total = $11, metodo_pago = $12
        WHERE id = $13 AND lavadero_id = $14
        RETURNING *
    """
    
    fila_actualizada = await db.fetchrow(
        update_q, 
        placa.upper(), tipo, emp, nota, subcat, niv_suc,
        cli_nom, cli_tel, adicionales_json, precio_adicionales, precio_total, met_pag,
        lavado_id, lavadero_id
    )
    return parse_lavado(fila_actualizada)


@router.delete("/{lavado_id}", status_code=204)
async def eliminar_lavado(
    lavado_id: int,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Elimina un lavado. El lavadero_id en el WHERE evita borrar datos de otro lavadero."""
    fila_previa = await db.fetchrow("SELECT fecha FROM lavados WHERE id = $1 AND lavadero_id = $2", lavado_id, lavadero_id)
    if not fila_previa:
        raise HTTPException(status_code=404, detail="Lavado no encontrado")
        
    caja_cerrada = await db.fetchval("SELECT id FROM cierres_caja WHERE lavadero_id = $1 AND fecha_cierre = $2", lavadero_id, fila_previa["fecha"])
    if caja_cerrada:
        raise HTTPException(status_code=400, detail="La caja de este día ya está cerrada. No se puede eliminar.")

    resultado = await db.execute(
        "DELETE FROM lavados WHERE id = $1 AND lavadero_id = $2",
        lavado_id, lavadero_id
    )
    if resultado == "DELETE 0":
        raise HTTPException(status_code=404, detail="Lavado no encontrado")