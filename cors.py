import http.server, sys, os
os.chdir(sys.argv[1])
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin','http://homeassistant.home.arpa:8123')
        self.send_header('Access-Control-Allow-Private-Network','true')
        self.send_header('Cache-Control','no-store')
        super().end_headers()
http.server.ThreadingHTTPServer(('0.0.0.0',8766),H).serve_forever()
