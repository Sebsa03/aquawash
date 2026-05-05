import urllib.request, json, urllib.error
try:
    req = urllib.request.Request('http://127.0.0.1:8000/lavados/120/estado', data=b'{"estado":"terminado"}', headers={'Content-Type': 'application/json', 'Authorization': 'Bearer 1'}, method='PATCH')
    print(urllib.request.urlopen(req).read().decode())
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode())
