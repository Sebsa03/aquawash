import urllib.request
import json

def check_local():
    print("\nRevisando registro local...")
    try:
        data = json.dumps({"email": "test2@test.com", "password": "pass", "nombre": "test", "plan": "pro"}).encode()
        req2 = urllib.request.Request("http://127.0.0.1:8000/auth/registro", data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req2) as resp2:
            print(resp2.status, resp2.read().decode())
    except Exception as e:
        print("Error en registro:", e)
        if hasattr(e, 'read'):
            print(e.read().decode())

if __name__ == "__main__":
    check_local()
