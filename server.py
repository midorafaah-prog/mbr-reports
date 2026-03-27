#!/usr/bin/env python3
"""
MBR-CST Smart Server
- يخدم الملفات الثابتة (HTML, CSS, JS)
- يعمل كـ proxy لـ OpenAI API (يتجاوز CORS)
الاستخدام: python3 server.py
"""
import json
import urllib.request
import urllib.error
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8899
HOST = '127.0.0.1'

class MBRProxyHandler(SimpleHTTPRequestHandler):

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        """Handle API proxy calls"""
        if self.path == '/api/openai':
            self._proxy_openai_completions()
        elif self.path == '/api/openai-test':
            self._proxy_openai_test()
        else:
            self.send_error(404, 'Not Found')

    def _proxy_openai_completions(self):
        """Proxy: POST /api/openai → OpenAI chat completions"""
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            data = json.loads(body)

            api_key = data.pop('_apiKey', '')
            if not api_key:
                self._json_response(400, {'error': 'API key missing'})
                return

            # Forward to OpenAI
            req = urllib.request.Request(
                'https://api.openai.com/v1/chat/completions',
                data=json.dumps(data).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {api_key}'
                },
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=90) as resp:
                result = resp.read()
                self._json_response(200, None, raw=result)

        except urllib.error.HTTPError as e:
            self._json_response(e.code, None, raw=e.read())
        except urllib.error.URLError as e:
            self._json_response(503, {'error': str(e.reason)})
        except Exception as e:
            self._json_response(500, {'error': str(e)})

    def _proxy_openai_test(self):
        """Proxy: GET /api/openai-test → test OpenAI API key"""
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length) if length > 0 else b'{}'
            data = json.loads(body) if body else {}
            api_key = data.get('_apiKey', '')
            if not api_key:
                self._json_response(400, {'error': 'API key missing'})
                return

            req = urllib.request.Request(
                'https://api.openai.com/v1/models',
                headers={'Authorization': f'Bearer {api_key}'},
                method='GET'
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                self._json_response(200, {'ok': True})

        except urllib.error.HTTPError as e:
            self._json_response(e.code, {'error': f'HTTP {e.code}'})
        except urllib.error.URLError as e:
            self._json_response(503, {'error': str(e.reason)})
        except Exception as e:
            self._json_response(500, {'error': str(e)})

    def _json_response(self, code, data, raw=None):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self._cors_headers()
        self.end_headers()
        if raw is not None:
            self.wfile.write(raw)
        else:
            self.wfile.write(json.dumps(data).encode('utf-8'))

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def log_message(self, format, *args):
        # Clean log output
        print(f'[MBR-CST] {args[0]} {args[1]}')


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer((HOST, PORT), MBRProxyHandler)
    print(f'')
    print(f'  ✦ MBR-CST Server يعمل على: http://localhost:{PORT}')
    print(f'  🤖 OpenAI Proxy: http://localhost:{PORT}/api/openai')
    print(f'  Ctrl+C للإيقاف')
    print(f'')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
        sys.exit(0)
