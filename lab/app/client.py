import http.client
import json
import sys
import uuid

mode = sys.argv[1] if len(sys.argv) > 1 else "new"
count = int(sys.argv[2]) if len(sys.argv) > 2 else 1
connection = None
failures = 0
for number in range(count):
    request_id = f"talk-{uuid.uuid4().hex[:8]}"
    try:
        if connection is None:
            connection = http.client.HTTPConnection("web", 8080, timeout=3)
        connection.request("GET", "/", headers={"X-Request-ID": request_id})
        client_ip, client_port = connection.sock.getsockname()
        response = connection.getresponse()
        payload = json.loads(response.read())
        print(json.dumps({"request": number + 1, "client_socket": f"{client_ip}:{client_port}",
                          "status": response.status, **payload}), flush=True)
    except (OSError, http.client.HTTPException) as error:
        failures += 1
        print(json.dumps({"request": number + 1, "request_id": request_id,
                          "error": type(error).__name__, "detail": str(error)}), flush=True)
        if connection is not None:
            connection.close()
        connection = None
    finally:
        if mode != "keepalive" and connection is not None:
            connection.close()
            connection = None
if connection is not None:
    connection.close()
sys.exit(1 if failures else 0)
