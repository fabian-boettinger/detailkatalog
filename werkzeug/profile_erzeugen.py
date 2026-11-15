"""Erzeugt die Profil-JSON-Dateien in profile/.

Aufruf:  python werkzeug/profile_erzeugen.py

Stahlprofile werden beim Erzeugen gegengeprüft: Querschnittsfläche aus h, b, t_w, t_f, r
muss zur Tabellenfläche A passen (Abweichung < 1,5 %), sonst Abbruch. So fallen Tippfehler auf.
"""
import json
import math
from pathlib import Path

ZIEL = Path(__file__).resolve().parent.parent / "profile"

# --- Stahl: I-Profile (h, b, t_w, t_f, r in mm; A in cm²) ------------------------------
IPE = {
    80: (80, 46, 3.8, 5.2, 5, 7.64), 100: (100, 55, 4.1, 5.7, 7, 10.3), 120: (120, 64, 4.4, 6.3, 7, 13.2),
    140: (140, 73, 4.7, 6.9, 7, 16.4), 160: (160, 82, 5.0, 7.4, 9, 20.1), 180: (180, 91, 5.3, 8.0, 9, 23.9),
    200: (200, 100, 5.6, 8.5, 12, 28.5), 220: (220, 110, 5.9, 9.2, 12, 33.4), 240: (240, 120, 6.2, 9.8, 15, 39.1),
    270: (270, 135, 6.6, 10.2, 15, 45.9), 300: (300, 150, 7.1, 10.7, 15, 53.8), 330: (330, 160, 7.5, 11.5, 18, 62.6),
    360: (360, 170, 8.0, 12.7, 18, 72.7), 400: (400, 180, 8.6, 13.5, 21, 84.5), 450: (450, 190, 9.4, 14.6, 21, 98.8),
    500: (500, 200, 10.2, 16.0, 21, 116), 550: (550, 210, 11.1, 17.2, 24, 134), 600: (600, 220, 12.0, 19.0, 24, 156),
}
HEA = {
    100: (96, 100, 5, 8, 12, 21.2), 120: (114, 120, 5, 8, 12, 25.3), 140: (133, 140, 5.5, 8.5, 12, 31.4),
    160: (152, 160, 6, 9, 15, 38.8), 180: (171, 180, 6, 9.5, 15, 45.3), 200: (190, 200, 6.5, 10, 18, 53.8),
    220: (210, 220, 7, 11, 18, 64.3), 240: (230, 240, 7.5, 12, 21, 76.8), 260: (250, 260, 7.5, 12.5, 24, 86.8),
    280: (270, 280, 8, 13, 24, 97.3), 300: (290, 300, 8.5, 14, 27, 112.5), 320: (310, 300, 9, 15.5, 27, 124.4),
    340: (330, 300, 9.5, 16.5, 27, 133.5), 360: (350, 300, 10, 17.5, 27, 142.8), 400: (390, 300, 11, 19, 27, 159.0),
    450: (440, 300, 11.5, 21, 27, 178.0), 500: (490, 300, 12, 23, 27, 197.5), 550: (540, 300, 12.5, 24, 27, 211.8),
    600: (590, 300, 13, 25, 27, 226.5), 650: (640, 300, 13.5, 26, 27, 241.6), 700: (690, 300, 14.5, 27, 27, 260.5),
    800: (790, 300, 15, 28, 30, 285.8), 900: (890, 300, 16, 30, 30, 320.5), 1000: (990, 300, 16.5, 31, 30, 346.8),
}
HEB = {
    100: (100, 100, 6, 10, 12, 26.0), 120: (120, 120, 6.5, 11, 12, 34.0), 140: (140, 140, 7, 12, 12, 43.0),
    160: (160, 160, 8, 13, 15, 54.3), 180: (180, 180, 8.5, 14, 15, 65.3), 200: (200, 200, 9, 15, 18, 78.1),
    220: (220, 220, 9.5, 16, 18, 91.0), 240: (240, 240, 10, 17, 21, 106.0), 260: (260, 260, 10, 17.5, 24, 118.4),
    280: (280, 280, 10.5, 18, 24, 131.4), 300: (300, 300, 11, 19, 27, 149.1), 320: (320, 300, 11.5, 20.5, 27, 161.3),
    340: (340, 300, 12, 21.5, 27, 170.9), 360: (360, 300, 12.5, 22.5, 27, 180.6), 400: (400, 300, 13.5, 24, 27, 197.8),
    450: (450, 300, 14, 26, 27, 218.0), 500: (500, 300, 14.5, 28, 27, 238.6), 550: (550, 300, 15, 29, 27, 254.1),
    600: (600, 300, 15.5, 30, 27, 270.0), 650: (650, 300, 16, 31, 27, 286.3), 700: (700, 300, 17, 32, 27, 306.4),
    800: (800, 300, 17.5, 33, 30, 334.2), 900: (900, 300, 18.5, 35, 30, 371.3), 1000: (1000, 300, 19, 36, 30, 400.0),
}
HEM = {
    100: (120, 106, 12, 20, 12, 53.2), 120: (140, 126, 12.5, 21, 12, 66.4), 140: (160, 146, 13, 22, 12, 80.6),
    160: (180, 166, 14, 23, 15, 97.1), 180: (200, 186, 14.5, 24, 15, 113.3), 200: (220, 206, 15, 25, 18, 131.3),
    220: (240, 226, 15.5, 26, 18, 149.4), 240: (270, 248, 18, 32, 21, 199.6), 260: (290, 268, 18, 32.5, 24, 219.6),
    280: (310, 288, 18.5, 33, 24, 240.2), 300: (340, 310, 21, 39, 27, 303.1), 320: (359, 309, 21, 40, 27, 312.0),
    340: (377, 309, 21, 40, 27, 315.8), 360: (395, 308, 21, 40, 27, 318.8), 400: (432, 307, 21, 40, 27, 325.8),
    450: (478, 307, 21, 40, 27, 335.4), 500: (524, 306, 21, 40, 27, 344.3), 550: (572, 306, 21, 40, 27, 354.4),
    600: (620, 305, 21, 40, 27, 363.7), 650: (668, 305, 21, 40, 27, 373.7), 700: (716, 304, 21, 40, 27, 383.0),
    800: (814, 303, 21, 40, 30, 404.3), 900: (910, 302, 21, 40, 30, 423.6), 1000: (1008, 302, 21, 40, 30, 444.2),
}
# U-Profile mit parallelen Flanschflächen (h, b, t_w, t_f, r; A in cm²)
UPE = {
    80: (80, 50, 4.0, 7.0, 10, 10.1), 100: (100, 55, 4.5, 7.5, 10, 12.5), 120: (120, 60, 5.0, 8.0, 12, 15.4),
    140: (140, 65, 5.0, 9.0, 12, 18.4), 160: (160, 70, 5.5, 9.5, 12, 21.7), 180: (180, 75, 5.5, 10.5, 12, 25.1),
    200: (200, 80, 6.0, 11.0, 13, 29.0), 220: (220, 85, 6.5, 12.0, 13, 33.9), 240: (240, 90, 7.0, 12.5, 15, 38.5),
    270: (270, 95, 7.5, 13.5, 15, 44.8), 300: (300, 100, 9.5, 15.0, 15, 56.6), 330: (330, 105, 11.0, 16.0, 18, 67.8),
    360: (360, 110, 12.0, 17.0, 18, 77.9), 400: (400, 115, 13.5, 18.0, 18, 91.9),
}

# Hohlprofile, gängige Abmessungen (Auswahl): rechteckig/quadratisch h × b × t, rund d × t
RHS = [(40, 20, 2), (50, 30, 3), (60, 40, 3), (60, 40, 4), (80, 40, 4), (80, 60, 4), (100, 50, 4), (100, 50, 5),
       (100, 60, 4), (100, 60, 5), (120, 60, 5), (120, 80, 5), (140, 80, 5), (150, 100, 5), (150, 100, 6),
       (160, 80, 6), (180, 100, 6), (200, 100, 6), (200, 100, 8), (200, 120, 8), (250, 150, 8), (300, 200, 10)]
SHS = [(40, 3), (50, 4), (60, 4), (70, 5), (80, 5), (90, 5), (100, 5), (100, 6), (120, 6), (140, 8), (150, 8),
       (160, 8), (180, 10), (200, 10), (250, 10), (300, 12)]
CHS = [(33.7, 3.2), (42.4, 3.2), (48.3, 3.2), (48.3, 4), (60.3, 4), (76.1, 4), (88.9, 4), (88.9, 5), (101.6, 5),
       (114.3, 5), (114.3, 6.3), (139.7, 6.3), (168.3, 6.3), (168.3, 8), (193.7, 8), (219.1, 8), (219.1, 10),
       (244.5, 10), (273, 10), (323.9, 10)]


def flaeche_i(h, b, tw, tf, r):
    return (2 * b * tf + (h - 2 * tf) * tw + (4 - math.pi) * r * r) / 100


def flaeche_u(h, b, tw, tf, r):
    return (2 * b * tf + (h - 2 * tf) * tw + (2 - math.pi / 2) * r * r) / 100


def reihe_walz(name, tab, flaeche):
    profile = []
    for nr, (h, b, tw, tf, r, A) in tab.items():
        A_r = flaeche(h, b, tw, tf, r)
        if abs(A_r - A) / A > 0.015:
            raise SystemExit(f"{name} {nr}: A berechnet {A_r:.2f} cm², Tabelle {A} cm²")
        profile.append({"name": f"{name} {nr}", "h": h, "b": b, "tw": tw, "tf": tf, "r": r, "A": A})
    return {"felder": {"h": "Höhe h", "b": "Breite b", "tw": "Stegdicke t_{w}", "tf": "Flanschdicke t_{f}",
                       "r": "Ausrundung r", "A": "Fläche A [cm²]"}, "profile": profile}


def schreibe(datei, inhalt):
    (ZIEL / datei).write_text(json.dumps(inhalt, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    n = sum(len(r["profile"]) for r in inhalt["reihen"].values())
    print(f"{datei}: {n} Profile")


def main():
    ZIEL.mkdir(exist_ok=True)
    dateien = []

    schreibe("stahl_walzprofile.json", {
        "titel": "Stahl, warmgewalzte I- und U-Profile",
        "quelle": "Maße nach DIN EN 10365:2017-11 (IPE, HEA, HEB, HEM, UPE); Fläche A zur Kontrolle der Werte",
        "reihen": {"IPE": reihe_walz("IPE", IPE, flaeche_i), "HEA": reihe_walz("HEA", HEA, flaeche_i),
                   "HEB": reihe_walz("HEB", HEB, flaeche_i), "HEM": reihe_walz("HEM", HEM, flaeche_i),
                   "UPE": reihe_walz("UPE", UPE, flaeche_u)},
    })
    dateien.append("stahl_walzprofile.json")

    rhs = [{"name": f"RHS {h}×{b}×{t}", "gruppe": "rechteckig", "h": h, "b": b, "t": t} for h, b, t in RHS]
    rhs += [{"name": f"SHS {a}×{a}×{t}", "gruppe": "quadratisch", "h": a, "b": a, "t": t} for a, t in SHS]
    chs = [{"name": f"CHS {str(d).replace('.', ',')}×{str(t).replace('.', ',')}", "d": d, "t": t} for d, t in CHS]
    schreibe("stahl_hohlprofile.json", {
        "titel": "Stahl, Hohlprofile (Auswahl gängiger Abmessungen)",
        "quelle": "Abmessungen nach DIN EN 10210-2 (warm) bzw. DIN EN 10219-2 (kalt); Auswahl, Lieferbarkeit beim Hersteller prüfen",
        "reihen": {"RHS": {"felder": {"h": "Höhe h", "b": "Breite b", "t": "Wanddicke t"}, "profile": rhs},
                   "CHS": {"felder": {"d": "Außendurchmesser d", "t": "Wanddicke t"}, "profile": chs}},
    })
    dateien.append("stahl_hohlprofile.json")

    bsh = [{"name": f"BSH {b}/{h}", "gruppe": f"b = {b}", "b": b, "h": h}
           for b in range(100, 281, 20) for h in range(120, 2001, 40)]
    kvh_q = [(60, 120), (60, 140), (60, 160), (60, 180), (60, 200), (60, 240), (80, 120), (80, 140), (80, 160),
             (80, 180), (80, 200), (80, 240), (100, 100), (100, 120), (100, 140), (100, 160), (100, 200),
             (100, 240), (120, 120), (120, 140), (120, 160), (120, 200), (120, 240)]
    kvh = [{"name": f"KVH {b}/{h}", "gruppe": f"b = {b}", "b": b, "h": h} for b, h in kvh_q]
    schreibe("holz_querschnitte.json", {
        "titel": "Holz, Brettschichtholz und Konstruktionsvollholz",
        "reihen": {
            "BSH": {"quelle": "DIN EN 14080; Breiten 100–280 mm, Höhen im 40-mm-Raster (Lamellen 40 mm), Lieferbarkeit beim Hersteller prüfen",
                    "felder": {"b": "Breite b", "h": "Höhe h"}, "profile": bsh},
            "KVH": {"quelle": "Gängige Vorzugsquerschnitte KVH (Auswahl), Lieferbarkeit beim Hersteller prüfen",
                    "felder": {"b": "Breite b", "h": "Höhe h"}, "profile": kvh},
        },
    })
    dateien.append("holz_querschnitte.json")

    aufbauten = {
        "L3": [(20, 20, 20), (20, 40, 20), (30, 30, 30), (30, 40, 30), (40, 40, 40)],
        "L5": [(20, 20, 20, 20, 20), (20, 30, 20, 30, 20), (40, 20, 20, 20, 40), (40, 20, 40, 20, 40),
               (40, 30, 40, 30, 40), (40, 40, 40, 40, 40), (40, 40, 80, 40, 40)],
        "L7": [(30, 30, 30, 40, 30, 30, 30), (30, 40, 30, 40, 30, 40, 30), (40, 40, 40, 40, 40, 40, 40)],
        # doppelte Längslagen (LL Q LL …), Typbezeichnung mit „s“
        "L5s": [(30, 30, 40, 30, 30), (40, 40, 40, 40, 40)],
        "L8s": [(30, 30, 40, 30, 30, 40, 30, 30), (40, 40, 30, 40, 40, 30, 40, 40)],
    }
    bsp = []
    for typ, liste in aufbauten.items():
        for lagen in liste:
            d = sum(lagen)
            # Decklagen in Haupttragrichtung der Platte (übliche Ausführung); Details rechnen das in
            # ihre Decklagenrichtung zur Schnittebene um (0° / 90°)
            bsp.append({"name": f"BSP {typ} {d} ({'-'.join(map(str, lagen))})", "gruppe": typ, "d": d,
                        "lagen": list(lagen), "decklage": "laengs",
                        "aufbau": "doppelt" if typ.endswith("s") else "abwechselnd"})
    schreibe("bsp_aufbauten.json", {
        "titel": "Brettsperrholz, generische Aufbauten",
        "quelle": "Generische Aufbauten ohne Herstellerbezug (Lagendicken beispielhaft); Herstelleraufbauten nur einzeln mit Quelle ergänzen",
        "reihen": {"BSP": {"felder": {"d": "Dicke d", "lagen": "Lagen von oben",
                                      "decklage": "Decklagen zur Haupttragrichtung (laengs/quer)",
                                      "aufbau": "Lagenfolge (abwechselnd / doppelt = Längslagen doppelt)"}, "profile": bsp}},
    })
    dateien.append("bsp_aufbauten.json")

    laengen = {
        6: list(range(60, 301, 20)),
        8: list(range(80, 301, 20)) + [330, 380, 430, 480, 530, 580],
        10: list(range(100, 301, 20)) + [330, 360, 400, 450, 500, 550, 600, 700, 800],
        12: list(range(120, 301, 20)) + [340, 380, 420, 480, 540, 600, 700, 800, 900, 1000],
        # Herstellerdurchmesser: Rothoblaas VGZ/VGS 7, 9, 11, 13; Würth ASSY plus VG 14
        7: list(range(80, 301, 20)) + [340, 380, 400],
        9: list(range(160, 401, 20)) + [440, 480, 520, 560, 600],
        11: [150, 200, 250, 275, 300, 325, 350, 375, 400, 450, 500, 550, 600, 800, 1000],
        13: [200, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500],
        14: [200, 300, 400, 500, 600, 800, 1000, 1200, 1500],
    }
    laengen = dict(sorted(laengen.items()))
    vg = [{"name": f"VG Ø{d} × {L}", "gruppe": f"d = {d} mm", "d": d, "L": L} for d, ls in laengen.items() for L in ls]
    schreibe("vollgewindeschrauben.json", {
        "titel": "Vollgewindeschrauben (allgemein)",
        "quelle": "Allgemeine Werte, Längenreihen beispielhaft; Abmessungen, Einschraubtiefen und Abstände nach ETA des Herstellers",
        "reihen": {"VG": {"felder": {"d": "Nenndurchmesser d", "L": "Länge L"}, "profile": vg}},
    })
    dateien.append("vollgewindeschrauben.json")

    (ZIEL / "index.json").write_text(json.dumps({"dateien": dateien}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
