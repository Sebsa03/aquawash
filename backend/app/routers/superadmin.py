from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.config import settings
from pydantic import BaseModel

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = settings.secret_key
ALGORITHM  = settings.algorithm

def get_superadmin(token: str = Depends(oauth2_scheme)):
    error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Acceso denegado: Se requiere rol Super Admin",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        rol = payload.get("rol")
        if rol != "superadmin":
            raise error
        return payload
    except JWTError:
        raise error

class EstadoSuscripcionActualizar(BaseModel):
    estado_suscripcion: str

@router.get("/lavaderos")
async def listar_lavaderos(db=Depends(get_db), admin=Depends(get_superadmin)):
    """Devuelve la lista de todos los lavaderos (Inquilinos) en la plataforma."""
    filas = await db.fetch(
        """
        SELECT id, nombre, ciudad, telefono, email, plan, estado_suscripcion, trial_hasta, created_at as creado_en
        FROM lavaderos
        ORDER BY created_at DESC
        """
    )
    return [dict(f) for f in filas]

@router.patch("/lavaderos/{lavadero_id}/estado")
async def actualizar_estado_suscripcion(
    lavadero_id: int, 
    datos: EstadoSuscripcionActualizar, 
    db=Depends(get_db), 
    admin=Depends(get_superadmin)
):
    """Permite al Super Admin cambiar el estado de suscripción de un lavadero (activo, suspendido, trial, cancelado)."""
    estados_validos = ["activo", "suspendido", "trial", "cancelado"]
    if datos.estado_suscripcion not in estados_validos:
        raise HTTPException(status_code=400, detail="Estado no válido")
    
    fila = await db.fetchrow(
        """
        UPDATE lavaderos
        SET estado_suscripcion = $1
        WHERE id = $2
        RETURNING id, nombre, estado_suscripcion
        """,
        datos.estado_suscripcion, lavadero_id
    )
    if not fila:
        raise HTTPException(status_code=404, detail="Lavadero no encontrado")
    
    return dict(fila)
