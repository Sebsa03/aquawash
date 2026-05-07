import urllib.request
import json

def test_cancelar():
    # 1. Login
    data_login = json.dumps({"email": "admin@aquawash.com", "password": "SuperAdmin2026*"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8000/auth/login", data=data_login, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        token = json.loads(resp.read().decode())["access_token"]
        print("Token superadmin obtenido")

    # 2. Login tenant
    data_login2 = json.dumps({"email": "donsebas@aquawash.com", "password": "pass"}).encode()
    req2 = urllib.request.Request("http://127.0.0.1:8000/auth/login", data=data_login2, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req2) as resp:
        token2 = json.loads(resp.read().decode())["access_token"]
        print("Token tenant obtenido")

    # 3. Cancelar lavado 123
    data_cancel = json.dumps({"estado": "cancelado", "motivo_cancelacion": "Test error"}).encode()
    req3 = urllib.request.Request("http://127.0.0.1:8000/lavados/1/estado", data=data_cancel, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token2}"
    }, method="PATCH")
    try:
        with urllib.request.urlopen(req3) as resp:
            print(resp.status, resp.read().decode())
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        print(e.read().decode())

if __name__ == "__main__":
    test_cancelar()
