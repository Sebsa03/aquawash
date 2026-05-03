from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import settings

SECRET_KEY = settings.secret_key
ALGORITHM  = settings.algorithm
EXPIRE_MIN = settings.access_token_expire_minutes

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hashear_password(password: str) -> str:
    return pwd_context.hash(password)

def verificar_password(password: str, hash: str) -> bool:
    return pwd_context.verify(password, hash)

def crear_token(data: dict) -> str:
    payload = data.copy()
    expira  = datetime.utcnow() + timedelta(minutes=EXPIRE_MIN)
    payload.update({"exp": expira})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_lavadero_actual(token: str = Depends(oauth2_scheme)):
    error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload     = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        lavadero_id = payload.get("lavadero_id")
        if lavadero_id is None:
            raise error
        return lavadero_id
    except JWTError:
        raise error