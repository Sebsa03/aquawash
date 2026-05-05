import urllib.request, json, urllib.error
try:
    req1 = urllib.request.Request('http://127.0.0.1:8000/auth/login', data=b'{"email":"demo@aquawash.com", "password":"demo"}', headers={'Content-Type': 'application/json'}, method='POST')
    res = urllib.request.urlopen(req1).read().decode()
    token = json.loads(res)['token']
    
    req2 = urllib.request.Request('http://127.0.0.1:8000/lavados/120/estado', data=b'{"estado":"terminado"}', headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}, method='PATCH')
    print(urllib.request.urlopen(req2).read().decode())
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode())
