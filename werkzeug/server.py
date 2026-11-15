"""Lokaler Server für den Detailkatalog, ohne Browser-Cache.

Aufruf (im Repo-Ordner):  python werkzeug/server.py [port]
Dann http://127.0.0.1:8000/ öffnen.

Anders als `python -m http.server` sendet er "Cache-Control: no-store". Sonst mischt der Browser
nach einer Änderung neue und alte JS-Module, und die Seite bleibt leer.
Er erlaubt außerdem Zugriffe von anderen Ursprüngen (CORS), damit das Bemessungstool die Module lokal laden kann.
"""
import functools
import http.server
import os
import sys


class OhneCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    wurzel = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    handler = functools.partial(OhneCache, directory=wurzel)
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
