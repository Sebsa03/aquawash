from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from typing import Optional
from datetime import date, timedelta, datetime
from pydantic import BaseModel
from app.routers.auth import verificar_password, crear_token, hashear_password, get_lavadero_actual
from app.config import settings
import uuid
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class PinVerifyRequest(BaseModel):
    pin: str

class RegisterRequest(BaseModel):
    nombre: str
    ciudad: Optional[str] = None
    telefono: Optional[str] = None
    email: str
    password: Optional[str] = None
    pin_dueno: str
    pin_operario: str
    plan: str = "pro"
    pais: str = "Desconocido"
    moneda: str = "USD"
    auth_provider: str = "local"
    provider_id: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    credential: str
    nombre_lavadero: Optional[str] = None
    ciudad: Optional[str] = None
    telefono: Optional[str] = None
    pin_dueno: Optional[str] = None
    pin_operario: Optional[str] = None
    pais: Optional[str] = 'CO'
    moneda: Optional[str] = 'COP'

class ForgotRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ResetPinsRequest(BaseModel):
    token: str
    new_pin_dueno: str
    new_pin_operario: str

def send_recovery_email(to_email: str, subject: str, link: str):
    sg_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("SENDGRID_FROM_EMAIL", "no-reply@aquawash.com")
    
    if not sg_key:
        print("⚠️ Advertencia: SENDGRID_API_KEY no configurado. No se enviará correo.")
        print(f"URL de recuperación para {to_email}: {link}")
        return

    html_content = f"""
    <h2>Recuperación de Credenciales de AquaWash</h2>
    <p>Has solicitado restablecer tus credenciales.</p>
    <p>Haz clic en el siguiente enlace para continuar:</p>
    <a href="{link}" style="display:inline-block;padding:10px 20px;color:white;background-color:#0ea5e9;text-decoration:none;border-radius:5px;">Restablecer mis datos</a>
    <p>Si no fuiste tú, puedes ignorar este correo de forma segura.</p>
    """
    
    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    
    try:
        sg = SendGridAPIClient(sg_key)
        response = sg.send(message)
        print(f"Correo enviado a {to_email} (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Error al enviar correo SendGrid: {e}")
        raise HTTPException(status_code=500, detail="Error al enviar el correo de recuperación")

@router.post("/login")
async def login(datos: LoginRequest, db=Depends(get_db)):
    try:
        if datos.email.lower().strip() == settings.superadmin_email.lower().strip() and datos.password == settings.superadmin_password:
            token = crear_token({
                "lavadero_id": 0,
                "email": settings.superadmin_email,
                "rol": "superadmin"
            })
            return {"access_token": token, "token_type": "bearer"}

        lavadero = await db.fetchrow(
            "SELECT id, email, password_hash, plan, estado_suscripcion, auth_provider "
            "FROM lavaderos WHERE email = $1",
            datos.email.lower().strip()
        )
        if not lavadero:
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        
        if lavadero["auth_provider"] == "google" and not lavadero["password_hash"]:
            raise HTTPException(status_code=401, detail="Esta cuenta se registró con Google. Usa el botón de Google para iniciar sesión.")
            
        if not verificar_password(datos.password, lavadero["password_hash"]):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
            
        if lavadero["estado_suscripcion"] == "suspendido":
            raise HTTPException(status_code=403, detail="Suscripcion suspendida.")
        if lavadero["estado_suscripcion"] == "cancelado":
            raise HTTPException(status_code=403, detail="Cuenta cancelada.")
            
        token = crear_token({
            "lavadero_id": lavadero["id"],
            "email":       lavadero["email"],
            "plan":        lavadero["plan"],
            "rol":         "tenant"
        })
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR LOGIN: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/google")
async def google_login(datos: GoogleLoginRequest, db=Depends(get_db)):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    try:
        idinfo = id_token.verify_oauth2_token(datos.credential, google_requests.Request(), client_id)
        email = idinfo['email']
        provider_id = idinfo['sub']
        nombre = idinfo.get('name', '')
        
        lavadero = await db.fetchrow(
            "SELECT id, email, plan, estado_suscripcion FROM lavaderos WHERE email = $1", 
            email.lower().strip()
        )
        
        if lavadero:
            # Login exitoso
            if lavadero["estado_suscripcion"] == "suspendido":
                raise HTTPException(status_code=403, detail="Suscripción suspendida.")
            if lavadero["estado_suscripcion"] == "cancelado":
                raise HTTPException(status_code=403, detail="Cuenta cancelada.")
                
            token = crear_token({
                "lavadero_id": lavadero["id"],
                "email": lavadero["email"],
                "plan": lavadero["plan"],
                "rol": "tenant"
            })
            return {"access_token": token, "token_type": "bearer", "status": "logged_in"}

        if datos.nombre_lavadero and datos.pin_dueno and datos.pin_operario:
            # Crear cuenta nueva con Google
            trial_hasta = date.today() + timedelta(days=7)
            pwd_hash = ""
            pais = datos.pais or "CO"
            moneda = datos.moneda or "COP"

            new_lavadero = await db.fetchrow(
                """
                INSERT INTO lavaderos (
                    nombre, ciudad, telefono, email, password_hash,
                    pin_dueno, pin_operario,
                    plan, estado_suscripcion, trial_hasta,
                    precio_moto, precio_carro, precio_furgon, precio_camion, precio_bus,
                    pais, moneda, auth_provider, provider_id
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'trial',$9,10000,15000,20000,25000,30000,$10,$11,$12,$13)
                RETURNING id, email, plan
                """,
                datos.nombre_lavadero.strip(), datos.ciudad, datos.telefono,
                email.lower().strip(), pwd_hash,
                datos.pin_dueno.strip(), datos.pin_operario.strip(),
                "pro", trial_hasta,
                pais, moneda, "google", provider_id
            )
            for nombre_adicional, precio in [
                ("Aspirado",5000),("Encerado",8000),
                ("Lavado de motor",12000),("Pulida de rines",6000),("Ambientador",3000)
            ]:
                await db.execute(
                    "INSERT INTO adicionales_catalogo (lavadero_id, nombre, precio) VALUES ($1,$2,$3)",
                    new_lavadero["id"], nombre_adicional, precio
                )
            token = crear_token({
                "lavadero_id": new_lavadero["id"],
                "email": new_lavadero["email"],
                "plan": new_lavadero["plan"],
                "rol": "tenant"
            })
            return {"access_token": token, "token_type": "bearer", "status": "registered"}

        return {
            "status": "requires_registration", 
            "needs_more_data": True,
            "email": email, 
            "nombre": nombre, 
            "provider_id": provider_id
        }
            
    except ValueError:
        raise HTTPException(status_code=401, detail="Token de Google inválido")

@router.post("/verify-pin")
async def verify_pin(datos: PinVerifyRequest, db=Depends(get_db), lavadero_id: int = Depends(get_lavadero_actual)):
    fila = await db.fetchrow("SELECT pin_dueno, pin_operario FROM lavaderos WHERE id = $1", lavadero_id)
    if not fila:
        raise HTTPException(status_code=404, detail="Lavadero no encontrado")
        
    pin_ingresado = datos.pin.strip()
    
    if pin_ingresado == fila["pin_dueno"]:
        return {"rol": "dueno"}
    elif pin_ingresado == fila["pin_operario"]:
        return {"rol": "operario"}
    else:
        raise HTTPException(status_code=401, detail="PIN Incorrecto")

@router.post("/registro", status_code=201)
async def registro(datos: RegisterRequest, db=Depends(get_db)):
    existe = await db.fetchrow(
        "SELECT id FROM lavaderos WHERE email = $1",
        datos.email.lower().strip()
    )
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")
    
    if datos.plan not in ["pro"]:
        datos.plan = "pro"
        
    trial_hasta = date.today() + timedelta(days=7)
    pwd_hash = hashear_password(datos.password) if datos.password else ""
    
    lavadero = await db.fetchrow(
        """
        INSERT INTO lavaderos (
            nombre, ciudad, telefono, email, password_hash,
            pin_dueno, pin_operario,
            plan, estado_suscripcion, trial_hasta,
            precio_moto, precio_carro, precio_furgon, precio_camion, precio_bus,
            pais, moneda, auth_provider, provider_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'trial',$9,10000,15000,20000,25000,30000,$10,$11,$12,$13)
        RETURNING id, email, plan
        """,
        datos.nombre.strip(), datos.ciudad, datos.telefono,
        datos.email.lower().strip(), pwd_hash,
        datos.pin_dueno.strip(), datos.pin_operario.strip(),
        datos.plan, trial_hasta,
        datos.pais, datos.moneda, datos.auth_provider, datos.provider_id
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

@router.post("/forgot-password")
async def forgot_password(datos: ForgotRequest, db=Depends(get_db)):
    email = datos.email.lower().strip()
    lavadero = await db.fetchrow("SELECT id, auth_provider FROM lavaderos WHERE email = $1", email)
    
    if not lavadero:
        return {"mensaje": "Si el correo existe, se enviarán las instrucciones."}
        
    if lavadero["auth_provider"] == "google":
        raise HTTPException(status_code=400, detail="Esta cuenta usa Google. No tiene contraseña.")

    token = str(uuid.uuid4())
    expires = datetime.now() + timedelta(hours=1)
    
    await db.execute("UPDATE lavaderos SET reset_token = $1, reset_token_expires = $2 WHERE id = $3", token, expires, lavadero["id"])
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url.rstrip('/')}/reset-password/{token}"
    
    send_recovery_email(email, "Recupera tu contraseña en AquaWash", reset_link)
    
    return {"mensaje": "Si el correo existe, se enviarán las instrucciones."}

@router.post("/forgot-pins")
async def forgot_pins(datos: ForgotRequest, db=Depends(get_db)):
    email = datos.email.lower().strip()
    lavadero = await db.fetchrow("SELECT id FROM lavaderos WHERE email = $1", email)
    
    if not lavadero:
        return {"mensaje": "Si el correo existe, se enviarán las instrucciones."}

    token = str(uuid.uuid4())
    expires = datetime.now() + timedelta(hours=1)
    
    await db.execute("UPDATE lavaderos SET reset_token = $1, reset_token_expires = $2 WHERE id = $3", token, expires, lavadero["id"])
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url.rstrip('/')}/reset-pins/{token}"
    
    send_recovery_email(email, "Recupera tus PINs en AquaWash", reset_link)
    
    return {"mensaje": "Si el correo existe, se enviarán las instrucciones."}

@router.post("/reset-password")
async def reset_password(datos: ResetPasswordRequest, db=Depends(get_db)):
    lavadero = await db.fetchrow(
        "SELECT id FROM lavaderos WHERE reset_token = $1 AND reset_token_expires > NOW()", 
        datos.token
    )
    if not lavadero:
        raise HTTPException(status_code=400, detail="Token inválido o expirado.")
        
    new_hash = hashear_password(datos.new_password)
    
    await db.execute(
        "UPDATE lavaderos SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
        new_hash, lavadero["id"]
    )
    return {"mensaje": "Contraseña actualizada exitosamente."}

@router.post("/reset-pins")
async def reset_pins(datos: ResetPinsRequest, db=Depends(get_db)):
    lavadero = await db.fetchrow(
        "SELECT id FROM lavaderos WHERE reset_token = $1 AND reset_token_expires > NOW()", 
        datos.token
    )
    if not lavadero:
        raise HTTPException(status_code=400, detail="Token inválido o expirado.")
        
    await db.execute(
        "UPDATE lavaderos SET pin_dueno = $1, pin_operario = $2, reset_token = NULL, reset_token_expires = NULL WHERE id = $3",
        datos.new_pin_dueno.strip(), datos.new_pin_operario.strip(), lavadero["id"]
    )
    return {"mensaje": "PINs actualizados exitosamente."}
