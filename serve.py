#!/usr/bin/env python3
"""Serve FastRoute and proxy transit APIs (fixes browser CORS / Failed to fetch)."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
import urllib.error
import urllib.request

UPSTREAMS = {
    "/api/db/": "https://v6.db.transport.rest/",
    "/api/db-v5/": "https://v5.db.transport.rest/",
    "/api/nominatim/": "https://nominatim.openstreetmap.org/",
}

PORT = 8765


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        if args and str(args[0]).startswith("GET /api/"):
            print(fmt % args)

    def send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")

    def do_OPTIONS(self):
        if any(self.path.startswith(prefix) for prefix in UPSTREAMS):
            self.send_response(204)
            self.send_cors()
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
            self.end_headers()
            return
        super().do_OPTIONS()

    def do_GET(self):
        for prefix, upstream in UPSTREAMS.items():
            if self.path.startswith(prefix):
                self.proxy(prefix, upstream)
                return
        super().do_GET()

    def proxy(self, prefix, upstream):
        rest = self.path[len(prefix) - 1 :]
        url = upstream.rstrip("/") + rest
        req = urllib.request.Request(url, headers={"User-Agent": "FastRoute/1.0 (local proxy)"})

        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                body = resp.read()
                self.send_response(resp.status)
                content_type = resp.headers.get("Content-Type", "application/json")
                self.send_header("Content-Type", content_type)
                self.send_cors()
                self.end_headers()
                self.wfile.write(body)
        except urllib.error.HTTPError as err:
            body = err.read()
            self.send_response(err.code)
            self.send_header("Content-Type", err.headers.get("Content-Type", "application/json"))
            self.send_cors()
            self.end_headers()
            self.wfile.write(body)
        except Exception as err:
            payload = f'{{"error":"proxy failed","message":"{err}"}}'.encode()
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_cors()
            self.end_headers()
            self.wfile.write(payload)


if __name__ == "__main__":
    root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root)
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"FastRoute → http://127.0.0.1:{PORT}")
    print("Use this server (not python -m http.server) so DB routing works in the browser.")
    server.serve_forever()
