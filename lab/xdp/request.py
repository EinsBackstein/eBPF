import http.client
import json
import sys
import uuid

port = int(sys.argv[1])
request_id = str(uuid.uuid4())
connection = http.client.HTTPConnection("192.0.2.2", port, timeout=2)
try:
    connection.request("GET", "/", headers={"X-Request-ID": request_id})
    response = connection.getresponse()
    body = json.loads(response.read())
    print(json.dumps({"port": port, "status": response.status, **body}))
except (TimeoutError, OSError) as error:
    print(json.dumps({"port": port, "request_id": request_id,
                      "error": type(error).__name__, "detail": str(error)}))
    raise SystemExit(1)
finally:
    connection.close()
