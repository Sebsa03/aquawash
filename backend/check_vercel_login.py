import urllib.request
import json

def check_vercel_login():
    print("\nRevisando login...")
    try:
        data = json.dumps({"email": "donsebas@aquawash.com", "password": "pass"}).encode()
        req2 = urllib.request.Request("https://aquawash-lemon.vercel.app/auth/login", data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req2) as resp2:
            print(resp2.status, resp2.read().decode())
    except Exception as e:
        print("Error en login:", e)
        if hasattr(e, 'read'):
            print(e.read().decode())

if __name__ == "__main__":
    check_vercel_login()
