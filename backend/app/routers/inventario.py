from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_db
from app.routers.auth import get_lavadero_actual
from app.models.schemas import (
    ProductoCrear, ProductoRespuesta, ProductoActualizar,
    RecetaCrear, RecetaRespuesta, RecetaConProducto,
    MovimientoCrear, MovimientoRespuesta
)
from typing import List

router = APIRouter()

# ── INVENTARIO (PRODUCTOS) ───────────────────────────────────

@router.post("/productos", response_model=ProductoRespuesta, status_code=201)
async def crear_producto(
    datos: ProductoCrear,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    existe = await db.fetchval(
        "SELECT id FROM inventario WHERE lavadero_id = $1 AND LOWER(nombre) = LOWER($2)",
        lavadero_id, datos.nombre
    )
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un producto con este nombre")

    fila = await db.fetchrow(
        """
        INSERT INTO inventario (lavadero_id, nombre, cantidad, unidad, stock_minimo)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        """,
        lavadero_id, datos.nombre, datos.cantidad, datos.unidad, datos.stock_minimo
    )
    return dict(fila)

@router.get("/productos", response_model=List[ProductoRespuesta])
async def listar_productos(
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    filas = await db.fetch("SELECT * FROM inventario WHERE lavadero_id = $1 ORDER BY nombre ASC", lavadero_id)
    return [dict(f) for f in filas]

@router.patch("/productos/{producto_id}", response_model=ProductoRespuesta)
async def actualizar_producto(
    producto_id: int,
    datos: ProductoActualizar,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    prod = await db.fetchrow("SELECT * FROM inventario WHERE id = $1 AND lavadero_id = $2", producto_id, lavadero_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    n_nombre = datos.nombre if datos.nombre is not None else prod["nombre"]
    n_cant = datos.cantidad if datos.cantidad is not None else prod["cantidad"]
    n_uni = datos.unidad if datos.unidad is not None else prod["unidad"]
    n_min = datos.stock_minimo if datos.stock_minimo is not None else prod["stock_minimo"]

    fila = await db.fetchrow(
        """
        UPDATE inventario 
        SET nombre = $1, cantidad = $2, unidad = $3, stock_minimo = $4
        WHERE id = $5 AND lavadero_id = $6
        RETURNING *
        """,
        n_nombre, n_cant, n_uni, n_min, producto_id, lavadero_id
    )
    return dict(fila)

@router.delete("/productos/{producto_id}", status_code=204)
async def eliminar_producto(
    producto_id: int,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    res = await db.execute("DELETE FROM inventario WHERE id = $1 AND lavadero_id = $2", producto_id, lavadero_id)
    if res == "DELETE 0":
        raise HTTPException(status_code=404, detail="Producto no encontrado")

# ── RECETAS (AUTOMATIZACIÓN) ─────────────────────────────────

@router.post("/recetas", response_model=RecetaRespuesta, status_code=201)
async def crear_receta(
    datos: RecetaCrear,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    # Validar que el producto exista
    prod = await db.fetchrow("SELECT id FROM inventario WHERE id = $1 AND lavadero_id = $2", datos.producto_id, lavadero_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Validar si ya existe la receta para evitar duplicados
    existe = await db.fetchval(
        """
        SELECT id FROM recetas 
        WHERE lavadero_id = $1 AND producto_id = $2 AND tipo_servicio = $3 AND LOWER(nombre_servicio) = LOWER($4)
        """,
        lavadero_id, datos.producto_id, datos.tipo_servicio, datos.nombre_servicio
    )
    if existe:
        raise HTTPException(status_code=400, detail="Esta receta ya existe")

    fila = await db.fetchrow(
        """
        INSERT INTO recetas (lavadero_id, producto_id, tipo_servicio, nombre_servicio, cantidad)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        """,
        lavadero_id, datos.producto_id, datos.tipo_servicio, datos.nombre_servicio, datos.cantidad
    )
    return dict(fila)

@router.get("/recetas", response_model=List[RecetaConProducto])
async def listar_recetas(
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    filas = await db.fetch(
        """
        SELECT r.*, i.nombre as producto_nombre, i.unidad as producto_unidad
        FROM recetas r
        JOIN inventario i ON r.producto_id = i.id
        WHERE r.lavadero_id = $1
        ORDER BY r.tipo_servicio ASC, r.nombre_servicio ASC
        """,
        lavadero_id
    )
    return [dict(f) for f in filas]

@router.delete("/recetas/{receta_id}", status_code=204)
async def eliminar_receta(
    receta_id: int,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    res = await db.execute("DELETE FROM recetas WHERE id = $1 AND lavadero_id = $2", receta_id, lavadero_id)
    if res == "DELETE 0":
        raise HTTPException(status_code=404, detail="Receta no encontrada")

# ── MOVIMIENTOS ──────────────────────────────────────────────

@router.post("/movimientos", response_model=MovimientoRespuesta, status_code=201)
async def registrar_movimiento(
    datos: MovimientoCrear,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    if datos.tipo not in ('entrada', 'salida', 'consumo'):
        raise HTTPException(status_code=400, detail="Tipo de movimiento inválido")

    prod = await db.fetchrow("SELECT cantidad FROM inventario WHERE id = $1 AND lavadero_id = $2", datos.producto_id, lavadero_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Actualizar stock
    nueva_cantidad = float(prod["cantidad"])
    if datos.tipo == 'entrada':
        nueva_cantidad += datos.cantidad
    else:
        nueva_cantidad -= datos.cantidad
        if nueva_cantidad < 0:
             nueva_cantidad = 0 # No permitir stock negativo
             # (Opcional) raise HTTPException(status_code=400, detail="Stock insuficiente")

    await db.execute(
        "UPDATE inventario SET cantidad = $1 WHERE id = $2",
        nueva_cantidad, datos.producto_id
    )

    # Registrar movimiento
    fila = await db.fetchrow(
        """
        INSERT INTO movimientos_inventario (lavadero_id, producto_id, tipo, cantidad, motivo)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        """,
        lavadero_id, datos.producto_id, datos.tipo, datos.cantidad, datos.motivo
    )
    
    # Obtener info del producto para la respuesta
    mov_dict = dict(fila)
    prod_info = await db.fetchrow("SELECT nombre, unidad FROM inventario WHERE id = $1", datos.producto_id)
    mov_dict["producto_nombre"] = prod_info["nombre"]
    mov_dict["producto_unidad"] = prod_info["unidad"]
    return mov_dict

@router.get("/movimientos", response_model=List[MovimientoRespuesta])
async def listar_movimientos(
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    filas = await db.fetch(
        """
        SELECT m.*, i.nombre as producto_nombre, i.unidad as producto_unidad
        FROM movimientos_inventario m
        JOIN inventario i ON m.producto_id = i.id
        WHERE m.lavadero_id = $1
        ORDER BY m.fecha DESC
        LIMIT 100
        """,
        lavadero_id
    )
    return [dict(f) for f in filas]
