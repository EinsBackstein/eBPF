import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        response = {
            "backend": os.environ["HOSTNAME"],
            "request_id": self.headers.get("X-Request-ID", "healthcheck"),
            "connection": f"{self.client_address[0]}:{self.client_address[1]}",
        }
        body = json.dumps(response).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        if response["request_id"] != "healthcheck":
            print(json.dumps(response), flush=True)

    def log_message(self, *_):
        pass


ThreadingHTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
