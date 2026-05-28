import urllib.request
import json

def check_vercel():
    try:
        print("Revisando la raiz...")
        req = urllib.request.Request("https://aquawash-lemon.vercel.app/")
        with urllib.request.urlopen(req) as resp:
            print(resp.status, resp.read().decode())
    except Exception as e:
        print("Error en raiz:", e)
        if hasattr(e, 'read'):
            print(e.read().decode())

    print("\nRevisando registro...")
    try:
        data = json.dumps({"estado": "cancelado", "motivo_cancelacion": "Test"}).encode()
        req2 = urllib.request.Request("https://aquawash-lemon.vercel.app/lavados/123/estado", data=data, headers={"Content-Type": "application/json"}, method="PATCH")
        with urllib.request.urlopen(req2) as resp2:
            print(resp2.status, resp2.read().decode())
    except Exception as e:
        print("Error en registro:", e)
        if hasattr(e, 'read'):
            print(e.read().decode())

if __name__ == "__main__":
    check_vercel()
