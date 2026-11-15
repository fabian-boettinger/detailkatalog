# detailkatalog
Parametrischer Detailkatalog für die Tragwerksplanung: Standardanschlüsse im Stahl- und Holzbau als maßstäbliche Skizzen, Maße und Profile wählbar, Prüfung der Mindestabstände live, Export als PNG für die Statik. Läuft im Browser, ohne Installation. Ungeprüft, keine Gewähr; Verbindungsmittel nach ETA.

Online: https://fabian-boettinger.github.io/detailkatalog/

## Aufbau

- `index.html`, `js/app.js` – Katalogseite (Liste, Detailansicht, Eingaben, Bild/SVG/Link kopieren)
- `js/dk.js` – Zeichenbausteine, Stile (Farbe und s/w), Layoutprüfung
- `js/schraffur.js` – je Fläche erzeugte Holz- und Dämmschraffuren
- `js/parameter.js`, `js/profile.js`, `js/werkstoffe.js` – Eingaben, Profilkatalog, Festigkeitsklassen
- `details/dk-*.js` – ein Detail je Datei (meta, parameter, varianten, zeichne), Liste in `details/index.js`
- `profile/*.json` – Profilkatalog, erzeugt mit `werkzeug/profile_erzeugen.py`

## Arbeiten am Katalog

```sh
python werkzeug/server.py        # lokal ohne Browser-Cache: http://127.0.0.1:8000/
node werkzeug/pruefe.mjs         # alle Details und Testvarianten rendern (ausgabe/) und prüfen
```

`pruefe.mjs` bricht ab bei Layout-Warnungen, bei Abstandsfehlern mit Standardwerten und wenn ein
Standardprofil nicht im Katalog steht. Ist alles in Ordnung, aktualisiert es die Import-Map in
`index.html` (Inhalts-Hash je Modul), damit Browser nach einem Update keine alten Dateien mischen.
Vor jedem Commit ausführen.

Lizenz: keine. © Fabian Böttinger, alle Rechte vorbehalten.
