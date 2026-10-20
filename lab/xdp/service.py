import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

port = int(sys.argv[1])


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps({"server_port": port,
                           "request_id": self.headers.get("X-Request-ID")}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


ThreadingHTTPServer(("192.0.2.2", port), Handler).serve_forever()
