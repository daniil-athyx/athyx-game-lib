import http.server
import socketserver
import urllib.request
import os

class BrotliHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        clean_path = self.path.split('?')[0]
        if clean_path.startswith('/proxy/'):
            remote_path = clean_path[len('/proxy/'):]
            local_path = os.path.join("clutcher", "assets_proxy", remote_path)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            if not os.path.exists(local_path):
                try:
                    url = "https://assets.clutcher.io/" + remote_path
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req) as response, open(local_path, 'wb') as out_file:
                        out_file.write(response.read())
                except Exception as e:
                    self.send_error(404, f"Failed to proxy: {e}")
                    return
            self.path = "/clutcher/assets_proxy/" + remote_path
        elif clean_path.startswith('/clutcher/models/') or clean_path.startswith('/clutcher/z/models/'):
            # Check if file exists directly, if not check assets_proxy
            disk_path = clean_path.lstrip('/')
            if not os.path.exists(disk_path):
                # Try finding it in assets_proxy
                sub_path = clean_path[len('/clutcher/'):]
                alt1 = os.path.join("clutcher", "assets_proxy", sub_path)
                alt2 = os.path.join("clutcher", "assets_proxy", "z", sub_path) if not sub_path.startswith('z/') else os.path.join("clutcher", "assets_proxy", sub_path[2:])
                if os.path.exists(alt1):
                    self.path = "/" + alt1.replace('\\', '/')
                elif os.path.exists(alt2):
                    self.path = "/" + alt2.replace('\\', '/')
                else:
                    # Try downloading from clutcher assets
                    try:
                        url = "https://assets.clutcher.io/" + sub_path
                        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                        os.makedirs(os.path.dirname(alt1), exist_ok=True)
                        with urllib.request.urlopen(req) as response, open(alt1, 'wb') as out_file:
                            out_file.write(response.read())
                        self.path = "/" + alt1.replace('\\', '/')
                    except:
                        pass
        super().do_GET()

    def end_headers(self):
        if self.path.endswith('.br') or self.path.endswith('.br?'):
            self.send_header('Content-Encoding', 'br')
            if '.wasm' in self.path:
                self.send_header('Content-Type', 'application/wasm')
            elif '.js' in self.path:
                self.send_header('Content-Type', 'application/javascript')
        super().end_headers()

PORT = 8081
print(f"Serving on port {PORT} with Brotli support...")
with socketserver.TCPServer(("", PORT), BrotliHTTPRequestHandler) as httpd:
    httpd.serve_forever()
