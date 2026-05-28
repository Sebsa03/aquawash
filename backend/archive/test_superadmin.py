import json
import urllib.request

def test():
    req = urllib.request.Request(
        "http://127.0.0.1:8000/auth/login",
        data=json.dumps({
            "email": "admin@aquawash.com",
            "password": "SuperAdmin2026*"
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        print("Login:", resp.status, res)
        token = res["access_token"]
        
    req2 = urllib.request.Request(
        "http://127.0.0.1:8000/superadmin/lavaderos",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req2) as resp2:
        print("Lavaderos:", resp2.status, resp2.read().decode())

if __name__ == "__main__":
    test()
