from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from app.auth import verificar_password, crear_token, hashear_password
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    nombre: str
    ciudad: Optional[str] = None
    telefono: Optional[str] = None
    email: str
    password: str
    plan: str = "basico"

@router.post("/login")
async def login(datos: LoginRequest, db=Depends(get_db)):
    try:
        lavadero = await db.fetchrow(
            "SELECT id, email, password_hash, plan, estado_suscripcion "
            "FROM lavaderos WHERE email = $1",
            datos.email.lower().strip()
        )
        if not lavadero or not verificar_password(datos.password, lavadero["password_hash"]):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        if lavadero["estado_suscripcion"] == "suspendido":
            raise HTTPException(status_code=403, detail="Suscripcion suspendida.")
        if lavadero["estado_suscripcion"] == "cancelado":
            raise HTTPException(status_code=403, detail="Cuenta cancelada.")
        token = crear_token({
            "lavadero_id": lavadero["id"],
            "email":       lavadero["email"],
            "plan":        lavadero["plan"]
        })
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR LOGIN: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/registro", status_code=201)
async def registro(datos: RegisterRequest, db=Depends(get_db)):
    existe = await db.fetchrow(
        "SELECT id FROM lavaderos WHERE email = $1",
        datos.email.lower().strip()
    )
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")
    if datos.plan not in ["basico", "pro"]:
        datos.plan = "basico"
    trial_hasta = date.today() + timedelta(days=7)
    lavadero = await db.fetchrow(
        """
        INSERT INTO lavaderos (
            nombre, ciudad, telefono, email, password_hash,
            plan, estado_suscripcion, trial_hasta,
            precio_moto, precio_carro, precio_furgon, precio_camion, precio_bus
        ) VALUES ($1,$2,$3,$4,$5,$6,'trial',$7,10000,15000,20000,25000,30000)
        RETURNING id, email, plan
        """,
        datos.nombre.strip(), datos.ciudad, datos.telefono,
        datos.email.lower().strip(), hashear_password(datos.password),
        datos.plan, trial_hasta
    )
    for nombre, precio in [
        ("Aspirado",5000),("Encerado",8000),
        ("Lavado de motor",12000),("Pulida de rines",6000),("Ambientador",3000)
    ]:
        await db.execute(
            "INSERT INTO adicionales_catalogo (lavadero_id, nombre, precio) VALUES ($1,$2,$3)",
            lavadero["id"], nombre, precio
        )
    token = crear_token({
        "lavadero_id": lavadero["id"],
        "email":       lavadero["email"],
        "plan":        lavadero["plan"]
    })
    return {"access_token": token, "token_type": "bearer", "mensaje": "Cuenta creada"}