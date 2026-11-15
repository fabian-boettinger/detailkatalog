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
python werkzeug/server.py           # lokal ohne Browser-Cache: http://127.0.0.1:8000/
node werkzeug/pruefe.mjs            # alle Details und Testvarianten rendern (ausgabe/) und prüfen
node werkzeug/profildurchlauf.mjs   # Stahl-Details mit allen Profilkombinationen (--schrauben: je Schraubengröße)
```

`pruefe.mjs` bricht ab bei Layout-Warnungen, bei Abstandsfehlern mit Standardwerten und wenn ein
Standardprofil nicht im Katalog steht. Ist alles in Ordnung, aktualisiert es die Import-Map in
`index.html` (Inhalts-Hash je Modul), damit Browser nach einem Update keine alten Dateien mischen.
Vor jedem Commit ausführen.

## Automatische Anpassung der Stahlanschlüsse

Bei DK-ST-01, -02, -03 und -05 folgt die Anschlussgeometrie den gewählten Profilen (`js/stahlbau.js`):

- Schraubenzahl n und Lochabstand p₁ (`reiheEinpassen`): Blechhöhe ≥ 0,6 h, das Schraubenbild muss in den geraden
  Stegteil h – 2(t_f + r) passen. Reicht die Höhe nicht, wird erst p₁ (3 d₀ → 2,2 d₀), dann e₁ (1,8 d₀ → 1,2 d₀),
  dann n verkleinert.
- Wurzelmaß w (`wurzelmass`): Scheibe frei neben Steg + Ausrundung der Stütze (t_w + 2 r + d_U) und neben Steg + Naht
  des Trägers, Randabstand 1,2 d₀ im Stützenflansch. Die Stirnplatte steht nicht über den Stützenflansch (`plattenRand`).
- DK-ST-03: u (Schraubenachse – Flansch) wird bei niedrigen Trägern verkleinert, danach entfällt die dritte Reihe.

Eingaben mit `auto: true` (n, p₁, w) sind leer bzw. 0 = automatisch; ein eingegebener Wert bleibt unverändert und wird
nur geprüft. Das Detail meldet die ermittelten Werte in `z.auto` und Erläuterungen in `z.anpassungen`
(„Nicht lösbar: …“, wenn die Profile nicht zusammenpassen, z. B. Trägerflansch breiter als die Stütze). Der
Schraubendurchmesser wird nie automatisch geändert. `profildurchlauf.mjs` bricht ab, wenn ein Detail abstürzt, eine
passende Kombination Layout-Warnungen hat oder ein Abstand ohne Meldung nicht eingehalten ist.

Lizenz: keine. © Fabian Böttinger, alle Rechte vorbehalten.
