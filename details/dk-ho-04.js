// DK-HO-04 HBV-Decke auf BSP-Außenwand (Plattformbauweise)
// Port von dk_ho_04() (Detailkatalog Generator, 26.10.2026), parametrisch.
import { Zeichnung, massstab, waehleMassstab, fmt, ANNAHME_ETA, laengsLagen, bspTyp } from "../js/dk.js";
import { NADELHOLZ, BSP_LAGENFOLGE } from "../js/werkstoffe.js";
import { HOLZ, KMOD, bemessung, EC5 } from "../js/holzbau.js";
import { SCHRAUBEN_OPTIONEN, BSP_OPTIONEN, KLED_OPTIONEN, bspKennwerte, axRd, ftRdEta, sortimentHinweis, kmodText, HBV, hbvParameter, hbvNachweise, HBV_NACHWEISE } from "../js/hersteller.js";

export const meta = {
  id: "DK-HO-04",
  titel: "HBV-Decke auf BSP-Außenwand (Plattformbauweise)",
  kategorie: "Holzbau-Anschlüsse",
  beschreibung:
    "Endauflager einer Holz-Beton-Verbunddecke (BSP + Aufbeton) auf einer BSP-Außenwand in Plattformbauweise: " +
    "Die BSP-Decke läuft über die untere Wand bis zur Außenkante, die obere Wand steht auf dem BSP (nicht auf dem Aufbeton). " +
    "Elastische Lager (z. B. Xylofon) unter und über der Decke nach Bauphysik. " +
    "Wand–Decke: gekreuzte Vollgewindeschrauben von den Wandseiten in die Decke; obere Wand: Vollgewindeschraube " +
    "45° von außen und Winkel innen, im Aufbeton eingebettet. Aufbeton mit Randdämmstreifen an der oberen Wand. " +
    "HBV-Verbund: Kerve am Auflager, dahinter HBV-Schrauben. " +
    "Standard: Wand BSP 200 (5 × 40), Decke BSP 200 (5 × 40) + 120 mm Aufbeton, VG Ø8. " +
    "Schematische Ausführungsvariante, Verbindungsmittel nach ETA/Hersteller.",
  nachweise: [
    "Auflagerpressung Decke auf Wand: Querdruck BSP-Decke (f_{c,90,d}, k_{c,90}), Wandkrone (vertikale Lagen, f_{c,0,d}); Lasten der oberen Wand durch die Decke (Querdruck maßgebend)",
    "Elastisches Lager: zulässige Pressung und Setzung nach Hersteller für Dauerlast; Steifigkeit in der Schallberechnung",
    "Vollgewindeschrauben Wand–Decke: Schub senkrecht und parallel zur Wand (Scheibe, Wind), Abheben; Einschraubtiefen, Abstände nach ETA (Schmal-/Seitenfläche BSP)",
    "Obere Wand: Schub und Zug (Abheben, Kippen) über Schrägschraube und Winkel; Winkel im Aufbeton (Korrosion, Schallbrücke)",
    "Kerve: Betondruck in der Kerve, Abscheren des Vorholzes, Kerventiefe ≤ Decklage; Schubfluss am Auflager über Kerve + HBV-Schrauben",
    "Aufbeton ohne Verbund zur oberen Wand (Randdämmstreifen)",
    ...HBV_NACHWEISE,
    "Brandschutz: Abbrand Deckenunterseite und Wand, Fugen (Rauchdichtheit), Schrauben im Restquerschnitt",
    "Schallschutz: Flankenübertragung, Lagertyp nach Last, Schrauben durch das Lager mit Entkopplungsscheiben bzw. nach Herstellerangabe",
    "Montage: Verlegereihenfolge, Lagesicherung vor dem Betonieren, Feuchteschutz Holz beim Betonieren",
  ],
  vorschau: { x0: 0, x1: 672 }, // Ausschnitt für die Kachel (px)
  faustwerte: [
    "[[HEB-Träger auf BSP-Wand – Auflager und Lagesicherung]]: Schrauben in der Schmalseite BSP (d ≥ 8, 10d, Ausziehen nur ≥ 30° zur Faser)",
    "[[BSH-Stütze auf BSP-Wand – Ausführung]]: Wandkrone, nur vertikale Lagen tragen",
  ],
};

export const parameter = [
  { key: "wand", label: "BSP-Aufbau", typ: "profil", reihe: "BSP", standard: "BSP L5 200 (40-40-40-40-40)", fuellt: { lagen: "lagen_w", aufbau: "aufbau_w" }, gruppe: "Wand" },
  { key: "lagen_w", label: "Lagen von außen", typ: "lagen", einheit: "mm", standard: "40-40-40-40-40", gruppe: "Wand", weitere: true, hilfe: "Decklagen senkrecht" },
  { key: "aufbau_w", label: "Lagenfolge", typ: "auswahl", standard: "abwechselnd", optionen: BSP_LAGENFOLGE, gruppe: "Wand", weitere: true },
  { key: "klasse_w", label: "BSP-Lamellen", typ: "auswahl", standard: "C24", optionen: NADELHOLZ, gruppe: "Wand", weitere: true },
  // Decke spannt senkrecht zur Wand, also in der Zeichenebene: Decklagen in Haupttragrichtung → 0°
  { key: "decke", label: "BSP-Aufbau", typ: "profil", reihe: "BSP", standard: "BSP L5 200 (40-40-40-40-40)",
    fuellt: { lagen: "lagen_d", aufbau: "aufbau_d", decklage: ["richtung", (v) => (v === "quer" ? 90 : 0), false] }, gruppe: "Decke" },
  { key: "lagen_d", label: "Lagen von oben", typ: "lagen", einheit: "mm", standard: "40-40-40-40-40", gruppe: "Decke", weitere: true, hilfe: "z. B. 40-40-40-40-40" },
  { key: "aufbau_d", label: "Lagenfolge", typ: "auswahl", standard: "abwechselnd", optionen: BSP_LAGENFOLGE, gruppe: "Decke", weitere: true },
  { key: "richtung", label: "Decklagenrichtung", typ: "auswahl", standard: 0, gruppe: "Decke", weitere: true,
    optionen: [{ wert: 0, text: "0° – Faser in der Zeichenebene" }, { wert: 90, text: "90° – Faser senkrecht zur Zeichenebene" }] },
  { key: "klasse_d", label: "BSP-Lamellen", typ: "auswahl", standard: "C24", optionen: NADELHOLZ, gruppe: "Decke", weitere: true },
  { key: "bsp_hst", label: "BSP-Hersteller (Wand und Decke)", typ: "auswahl", standard: "allgemein", optionen: BSP_OPTIONEN, gruppe: "Decke", weitere: true },
  { key: "h_c", label: "Aufbeton h_{c}", typ: "zahl", einheit: "mm", standard: 120, min: 60, max: 200, gruppe: "Decke" },
  { key: "t_v", label: "Kerventiefe t_{v}", typ: "zahl", einheit: "mm", standard: 30, min: 15, max: 60, gruppe: "Decke", weitere: true },
  { key: "l_v", label: "Kervenlänge l_{v}", typ: "zahl", einheit: "mm", standard: 200, min: 100, max: 400, gruppe: "Decke", weitere: true },
  { key: "t_x", label: "Elast. Lager t", typ: "zahl", einheit: "mm", standard: 6, min: 0, max: 25, gruppe: "Lager", hilfe: "0 = ohne Lager" },
  { key: "hst", label: "Hersteller", typ: "auswahl", standard: "norm", optionen: SCHRAUBEN_OPTIONEN, gruppe: "Verschraubung" },
  { key: "d", label: "VG-Schrauben d", typ: "zahl", einheit: "mm", standard: 8, min: 6, max: 14, gruppe: "Verschraubung", weitere: true },
  ...hbvParameter("HBV-Verbund", 180),
  { key: "kled", label: "Lasteinwirkungsdauer", typ: "auswahl", standard: "mittel", optionen: KLED_OPTIONEN, gruppe: "Bemessung", weitere: true },
];

export const varianten = [
  { name: "rothoblaas", roh: { hst: "vgz", d: "9", bsp_hst: "storaenso" } },
  { name: "ctc", roh: { hbv: "ctc", hbv_d: "9", hbv_lef: "120" } },
  { name: "hbv_weit", roh: { hbv_e: "600", hbv_n: "2" } },
  { name: "hbv_eng", roh: { hbv_e: "60", hbv_n: "20" } },
  { name: "wuerth_kurz", roh: { hst: "assy", d: "10", kled: "kurz" } },
  { name: "duenn", roh: { wand: "BSP L3 100 (30-40-30)", decke: "BSP L5 140 (40-20-20-20-40)", h_c: "80", t_v: "20", l_v: "150" } },
  { name: "dick", roh: { wand: "BSP L7 280 (40-40-40-40-40-40-40)", decke: "BSP L7 280 (40-40-40-40-40-40-40)", h_c: "200", t_v: "40", l_v: "400", d: "12" } },
  { name: "ohne_lager", roh: { t_x: "0" } },
  { name: "lager_dick", roh: { t_x: "25" } },
  { name: "decke_quer", roh: { richtung: "90" } },
  { name: "kerve_tief", roh: { t_v: "60" } },
  { name: "doppellagen", roh: { decke: "BSP L8s 300 (40-40-30-40-40-30-40-40)", wand: "BSP L5s 200 (40-40-40-40-40)" } },
];

const LAMELLE_BSP = 150;
const H_OBEN = 250; // gezeigte Höhe der oberen Wand über OK Aufbeton (mindestens)
const H_UNTEN = 380; // gezeigte Höhe der unteren Wand unter UK Decke

export function zeichne(p, opt = {}) {
  const z = new Zeichnung(940, 500, {
    messe: opt.messe,
    felder: [{ name: "Schnitt", x0: 0, x1: 672 }, { name: "Text", x0: 712, x1: 940 }],
  });

  // ---------------- Abmessungen (mm), Ursprung Außenkante Wand / OK Aufbeton ----------------
  const { h_c, t_v, l_v, t_x, d } = p;
  const lw = p.lagen_w, ld = p.lagen_d;
  const richtung = Number(p.richtung);
  const t_w = lw.reduce((a, b) => a + b, 0);
  const h_d = ld.reduce((a, b) => a + b, 0);
  const y_ok = h_c, y_uk = h_c + h_d;
  const t_rd = 10, t_wi = 3, l_wi = Math.min(90, h_c - 20); // Randdämmstreifen, Winkel
  const x_kv1 = t_w + t_rd + l_wi + 40; // Kerve beginnt 40 mm hinter dem Winkel
  const x_kv2 = x_kv1 + l_v;
  const hbv = [0, 1, 2].map((i) => x_kv2 + 110 + p.hbv_e * i); // HBV-Schraubenpaare 45° im Abstand e
  const e_hc = Math.min(65, h_c - 25), e_hh = Math.min(55, h_d / 2); // Einbindung Beton / Holz
  const x_ende = hbv[2] + e_hc + e_hh + 80;

  // VG-Schrauben 45° (Fugenpunkte in Wanddickenanteilen wie im Original)
  const xf_o = 0.55 * t_w, yf_o = y_ok - t_x / 2;
  const o_start = [0, yf_o - xf_o], o_ende = [xf_o + (y_uk - 20 - yf_o), y_uk - 20];
  const yf_u = y_uk + t_x / 2;
  const xf_a = 0.5 * t_w, xf_b = 0.55 * t_w;
  const ya_end = y_ok + Math.min(60, h_d / 3);
  const a_start = [0, yf_u + xf_a], a_ende = [xf_a + (yf_u - ya_end), ya_end];
  const b_end_x = Math.min(Math.max(0.2 * t_w, 4 * d), xf_b - 30); // Spitze B vor der Deckenstirn
  const b_start = [t_w, yf_u + (t_w - xf_b)], b_ende = [b_end_x, yf_u - (xf_b - b_end_x)];
  const lang = (s, e) => Math.hypot(e[0] - s[0], e[1] - s[1]);

  // ---------------- Prüfungen ----------------
  z.pruefe("Obere Schraube: Gewinde in der Wand (≥ 6d)", lang(o_start, [xf_o, yf_o]), 6 * d, ANNAHME_ETA);
  z.pruefe("Obere Schraube: Gewinde in der Decke (≥ 6d)", lang([xf_o, yf_o], o_ende), 6 * d, ANNAHME_ETA);
  z.pruefe("Obere Schraube: Fugenpunkt – Wandinnenseite (≥ 4d)", t_w - xf_o, 4 * d, ANNAHME_ETA);
  z.pruefe("Schraube A: Gewinde in der Wand (≥ 6d)", lang(a_start, [xf_a, yf_u]), 6 * d, ANNAHME_ETA);
  z.pruefe("Schraube A: Gewinde in der Decke (≥ 6d)", lang([xf_a, yf_u], a_ende), 6 * d, ANNAHME_ETA);
  z.pruefe("Schraube B: Gewinde in der Decke (≥ 6d)", lang([xf_b, yf_u], b_ende), 6 * d, ANNAHME_ETA);
  z.pruefe("Schraube B: Spitze – Deckenstirn (≥ 4d)", b_ende[0], 4 * d, ANNAHME_ETA);
  z.pruefe("Fugenpunkte A/B – Wandaußenseite (≥ 4d)", Math.min(xf_a, xf_b), 4 * d, ANNAHME_ETA);
  z.pruefe("Kerve: Tiefe ≤ Decklage", ld[0] - t_v, 0, "geometrisch");
  z.pruefe("Kerve: Abstand zum Winkel (≥ 30)", x_kv1 - (t_w + t_rd + l_wi), 30, "konstruktiv");

  // ---------------- Tragfähigkeit (überschlägig) ----------------
  const kc90 = 1.0; // auf der sicheren Seite; BSP-ETA erlaubt meist mehr
  const kmod = KMOD[p.kled], km = kmodText(p.kled);
  const quer = (l, a) => Math.max(...l.filter((_, i) => !laengsLagen(l.length, a)[i]), 0);
  const bkD = bspKennwerte(p.bsp_hst, p.klasse_d, quer(ld, p.aufbau_d)), bkW = bspKennwerte(p.bsp_hst, p.klasse_w, quer(lw, p.aufbau_w));
  z.widerstand("q_{Rd}", `Querdruck BSP-Decke über Wanddicke ${fmt(t_w)} (k_{c,90} = 1,0, k_{mod} = ${km})`, bemessung(kc90 * bkD.fc90 * t_w, kmod), "kN/m", `${EC5}, 6.1.5 – f_{c,90,k} = ${fmt(bkD.fc90)} nach ${bkD.quelle}`);
  const tLaengs = lw.filter((_, i) => laengsLagen(lw.length, p.aufbau_w)[i]).reduce((u, v) => u + v, 0);
  z.widerstand("q_{Rd}", `Wandkrone, nur senkrechte Lagen (${fmt(tLaengs)} mm), k_{mod} = ${km}`, bemessung(HOLZ[p.klasse_w].fc0 * tLaengs, kmod), "kN/m", `${EC5}, 6.1.4`);
  // Herausziehen je Schraube, Achse 45° zur Faser in Wand und Decke
  const ax = (lef, kl, rho) => axRd(p.hst, d, lef, kl, 45, kmod, rho);
  const ft = ftRdEta(p.hst, d);
  const schraube = (name, lw_, ld_) => {
    const a = ax(lw_, p.klasse_w, bkW.rho), b = ax(ld_, p.klasse_d, bkD.rho);
    const werte = [[a.Rd, "Wand"], [b.Rd, "Decke"], ...(ft ? [[ft.Rd, "Stahlzug"]] : [])];
    const [w, wo] = werte.reduce((m, v) => (v[0] < m[0] ? v : m));
    z.widerstand(`F_{ax,Rd} ${name}`, `Herausziehen Wand / Decke${ft ? " / Stahlzug" : ""}, maßgebend ${wo}`, w, "kN", wo === "Stahlzug" ? ft.quelle : a.quelle);
  };
  schraube("obere Schraube", lang(o_start, [xf_o, yf_o]), lang([xf_o, yf_o], o_ende));
  schraube("Schraube A", lang(a_start, [xf_a, yf_u]), lang([xf_a, yf_u], a_ende));
  schraube("Schraube B", t_w - xf_b > 0 ? lang(b_start, [xf_b, yf_u]) : 0, lang([xf_b, yf_u], b_ende));
  z.tragHinweise.push("Querdruck: Linienlast je m Wand aus Decke und oberer Wand; elastisches Lager nach Herstellerangabe zusätzlich begrenzen",
    "Schrauben: Herausziehen je Schraube (α = 45° zur Faser); Schub in der Fuge mit dem Bemessungstool (BSP Wand–Decke) nachweisen");
  hbvNachweise(z, p, { h_holz: h_d, h_c, rho: bkD.rho, a3ist: hbv[0] });
  const sh = sortimentHinweis(p.hst, d);
  if (sh) z.tragHinweise.push(sh);

  // ---------------- Maßstab und Lage ----------------
  const x0 = 124; // Außenkante Wand in px; links davon die Beschriftung „außen“
  const m = waehleMassstab(Math.max(x_ende / (628 - x0), (H_OBEN + y_uk + H_UNTEN) / 390), [1.5, 2, 2.5, 3, 4, 5]);
  const yOK = Math.max(62 + H_OBEN / m, 150); // OK Aufbeton in px, darüber Platz für Beschriftung
  const h_ow = (yOK - 62) * m; // gezeigte Höhe der oberen Wand
  const D = massstab(x0, yOK, m);
  const { X, Y } = D, P = D.px;

  z.titel(20, 26, "Schnitt Außenwand / HBV-Decke");

  // ---------------- Bauteile ----------------
  // BSP-Decke (Lagen); Kerve und Aufbeton darüber
  const lagenOben = ld.map((_, i) => y_ok + ld.slice(0, i).reduce((u, v) => u + v, 0));
  const schraubenX = (yt, yb) => { // belegte x-Bereiche (px) der Schrauben in einer Deckenlage
    const belegt = [[X(t_w) - 4, X(t_w + t_rd + l_wi) + 6]];
    const seg = (s, e) => {
      const [ya, yb2] = [Math.max(Math.min(s[1], e[1]), yt), Math.min(Math.max(s[1], e[1]), yb)];
      if (yb2 <= ya) return;
      const xAt = (y) => s[0] + ((e[0] - s[0]) * (y - s[1])) / (e[1] - s[1]);
      const xs = [X(xAt(ya)), X(xAt(yb2))];
      belegt.push([Math.min(...xs) - 6, Math.max(...xs) + 6]);
    };
    seg(o_start, o_ende); seg(a_start, a_ende); seg(b_start, b_ende);
    for (const xs of hbv) seg([xs, y_ok - e_hc], [xs + e_hc + e_hh, y_ok + e_hh]);
    if (yt < y_ok + t_v) belegt.push([X(x_kv1) - 4, X(x_kv2) + 4]);
    belegt.push([X(t_w) - 2, X(t_w) + 2]);
    return belegt;
  };
  const frei = (i, a, b) => {
    const belegt = schraubenX(lagenOben[i], lagenOben[i] + ld[i]);
    return groessteLuecke(Math.max(a, X(t_w) + 4), b, belegt);
  };
  z.bsp(X(0), Y(y_ok), P(x_ende), ld.map(P), richtung, { frei, lamellePx: P(LAMELLE_BSP), laengs: laengsLagen(ld.length, p.aufbau_d) });
  z.poly([[X(t_w + t_rd), Y(0)], [X(x_ende), Y(0)], [X(x_ende), Y(y_ok)], [X(x_kv2), Y(y_ok)], [X(x_kv2), Y(y_ok + t_v)],
    [X(x_kv1), Y(y_ok + t_v)], [X(x_kv1), Y(y_ok)], [X(t_w + t_rd), Y(y_ok)]], "beton", 1.0);

  // Wände (stehendes BSP, Decklagen senkrecht = in der Zeichenebene)
  const wandFrei = (y1, y2, belegtY) => (i, a, b) => {
    const xl = lw.slice(0, i).reduce((u, v) => u + v, 0), xr = xl + lw[i];
    const belegt = [];
    for (const [s, e] of belegtY) {
      const xAt = (x) => s[1] + ((e[1] - s[1]) * (x - s[0])) / (e[0] - s[0]);
      const [u, v] = [Math.max(Math.min(s[0], e[0]), xl), Math.min(Math.max(s[0], e[0]), xr)];
      if (v <= u) continue;
      const ys = [Y(xAt(u)), Y(xAt(v))];
      belegt.push([Math.min(...ys) - 8, Math.max(...ys) + 8]);
    }
    return groessteLuecke(a, b, belegt);
  };
  const yW1 = -h_ow, yW2 = y_ok - t_x; // obere Wand
  const yW3 = y_uk + t_x, yW4 = y_uk + H_UNTEN; // untere Wand
  const laengsW = laengsLagen(lw.length, p.aufbau_w);
  z.bsp(X(0), Y(yW1), P(yW2 - yW1), lw.map(P), 0,
    { stehend: true, laengs: laengsW, lamellePx: P(LAMELLE_BSP), frei: wandFrei(yW1, yW2, [[o_start, o_ende], [[t_w - 50, y_ok - 55], [t_w, y_ok - 55]]]) });
  z.bsp(X(0), Y(yW3), P(yW4 - yW3), lw.map(P), 0,
    { stehend: true, laengs: laengsW, lamellePx: P(LAMELLE_BSP), frei: wandFrei(yW3, yW4, [[a_start, a_ende], [b_start, b_ende]]) });

  // elastische Lager
  if (t_x > 0) {
    const tx = Math.max(P(t_x), 2);
    z.rect(X(0), Y(y_ok) - tx, P(t_w), tx, "elastomer", 0.6);
    z.rect(X(0), Y(y_uk), P(t_w), tx, "elastomer", 0.6);
  }
  // Randdämmstreifen (Trennung Aufbeton / obere Wand) und Winkel innen
  z.rect(X(t_w + t_wi), Y(0), P(t_rd - t_wi), P(h_c), "daemm", 0.6);
  const tW = Math.max(P(t_wi), 1.5);
  z.rect(X(t_w), Y(y_ok - l_wi), tW, P(l_wi), "schraube", 0.6);
  z.rect(X(t_w), Y(y_ok) - tW, P(l_wi), tW, "schraube", 0.6);
  const yWs = y_ok - l_wi / 2, xWs = t_w + l_wi * 0.6;
  z.stabSchraeg(X(t_w - 50), Y(yWs), X(t_w + t_wi), Y(yWs), P(5));
  z.stabSchraeg(X(xWs), Y(y_ok - t_wi), X(xWs), Y(y_ok + Math.min(50, h_d - 20)), P(5));

  // Bewehrung (Q-Matte) schematisch
  const yq = Math.min(41, h_c / 3);
  z.linie(X(t_w + t_rd + 15), Y(yq), X(x_ende), Y(yq), "mass", 1.6);
  for (let xm = x_kv1; xm < x_ende - 40; xm += 150) z.kreis(X(xm), Y(yq + 4), Math.max(P(4), 1.6), "schraube", 0.6);

  // HBV-Schrauben 45°, VG-Schrauben
  for (const xs of hbv) z.stabSchraeg(X(xs), Y(y_ok - e_hc), X(xs + e_hc + e_hh), Y(y_ok + e_hh), P(7.5));
  for (const [s, e] of [[o_start, o_ende], [a_start, a_ende], [b_start, b_ende]]) z.stabSchraeg(X(s[0]), Y(s[1]), X(e[0]), Y(e[1]), P(d));

  // Bruchlinien
  z.linie(X(x_ende), Y(-10), X(x_ende), Y(y_uk + 10), "mass", 1.0, "6 3");
  z.linie(X(0) - 8, Y(yW1), X(t_w) + 8, Y(yW1), "mass", 1.0, "6 3");
  z.linie(X(0) - 8, Y(yW4), X(t_w) + 8, Y(yW4), "mass", 1.0, "6 3");

  // ---------------- Maße ----------------
  z.massH([X(0), X(t_w)], 46, [fmt(t_w)], [[X(0), Y(yW1) - 2], [X(t_w), Y(yW1) - 2]]);
  z.massV([Y(0), Y(y_ok), Y(y_uk)], X(x_ende) + 12, [fmt(h_c), fmt(h_d)], [[Y(0), X(x_ende)], [Y(y_ok), X(x_ende)], [Y(y_uk), X(x_ende)]]);

  // ---------------- Beschriftung links (außen) ----------------
  const xt = 16;
  z.text(xt, Y(yW1) + 22, "außen", 14, "start", "mass");
  const yo = Math.max(Y(yW1) + 52, Y(o_start[1]) - 14);
  z.hinweis(X(o_start[0]) + 2, Y(o_start[1]) + 2, `VG Ø${fmt(d)}, 45°`, xt, yo);
  let yLast = yo;
  if (t_x > 0) {
    const yx = Math.max(yo + 30, (Y(y_ok) + Y(y_uk)) / 2 - 4);
    const bx = z.hinweis(X(0) - 1, Y(y_ok) - P(t_x) / 2, "elast. Lager", xt, yx, "start", ["nach Bauphysik"]);
    z.linie(X(0) - 1, Y(y_uk) + Math.max(P(t_x), 2) / 2, bx.x1 + 3, bx.y1 + 3, "text", 0.8, null, "", { hinweis: true, eigene: [] });
    yLast = bx.y1;
  }
  const ya = Math.max(yLast + 34, Y(a_start[1]) + 24);
  z.hinweis(X(a_start[0]) + 2, Y(a_start[1]) + 2, `VG Ø${fmt(d)}, 45°`, xt, ya, "start", ["gekreuzt"]);

  // ---------------- Beschriftung oben rechts (über dem Aufbeton) ----------------
  const r1 = Y(0) - 58, r2 = Y(0) - 32;
  z.hinweis(X(t_w) + tW / 2, Y(y_ok - l_wi) + 2, "Winkel innen", X(t_w) + 14, r1);
  z.hinweis(X(t_w + t_wi + (t_rd - t_wi) / 2), Y(Math.min(20, h_c / 4)), "Randdämmstreifen", X(t_w) + 40, r2);
  const xa = Math.max(X(x_kv2) + 20, X(t_w) + 40 + z.messe("Randdämmstreifen", 14, false) + 24);
  z.hinweis(xa + 70, Y(yq) - 2, `Aufbeton ${fmt(h_c)}, Q-Matte`, xa, r1 - 4);

  // ---------------- Beschriftung unten rechts (unter der Decke) ----------------
  const ru = Y(y_uk) + 34;
  const bk = z.hinweis(X(x_kv1 + l_v * 0.3), Y(y_ok + t_v / 2), `Kerve t_{v} = ${fmt(t_v)}, l = ${fmt(l_v)}`, X(t_w) + 60, ru, "start", ["mit Aufbeton vergossen"]);
  const xh = Math.max(bk.x1 + 24, X(hbv[1]) - 20);
  z.hinweis(X(hbv[2] + e_hc + e_hh * 0.5), Y(y_ok + e_hh * 0.5), `${HBV[p.hbv].kurz} ${p.hbv === "sfs" ? "±45°" : "45°"}, e = ${fmt(p.hbv_e)}`, xh, ru);
  const rd = bk.y1 + 30;
  z.hinweis(X(t_w + 20), Y(y_uk) - 2, `BSP-Decke ${fmt(h_d)} ${bspTyp(ld, p.aufbau_d)}, ${p.klasse_d}`, X(t_w) + 24, rd);
  const rw = Math.max(rd + 34, Y(b_start[1]) + 30);
  z.hinweis(X(t_w) + 1, Math.min(rw - 6, Y(yW4) - 10), `BSP-Wand ${fmt(t_w)} ${bspTyp(lw, p.aufbau_w)}, ${p.klasse_w}`, X(t_w) + 24, rw);
  let unten = Math.max(Y(yW4) + 4, rw + 4);
  const bm = z.massstabBalken(X(t_w) + 24, rw + 24, m, balkenLaenge(m));
  unten = Math.max(unten, bm.y1);

  // ---------------- Text ----------------
  const T = 712;
  z.titel(T, 26, "Plattformstoß");
  const zeilen = [
    ["Decke läuft über die Wand,"], ["obere Wand steht auf BSP,"], ["nicht auf dem Aufbeton"], [""],
    ["Wand ↔ Decke:", true], [`VG Ø${fmt(d)} gekreuzt`], ["(Schub, Abheben)"], [""],
    ["Obere Wand:", true], [`VG Ø${fmt(d)} 45° von außen +`], ["Winkel innen im Aufbeton"], [""],
    ["HBV am Auflager:", true], [`Kerve ${fmt(t_v)} × ${fmt(l_v)}`], [`+ ${HBV[p.hbv].kurz}-Schrauben`], [""],
    ["Querdruck Decke maßgebend", true], ["(Last obere Wand + Decke)"], [""],
    ["Schrauben in Wandlängs-"], ["richtung versetzt"], [""],
    ["Abstände nach ETA prüfen", true],
    [`Maßstab 1 px = ${fmt(m)} mm`, false, "mass"],
  ];
  let y = 50;
  for (const [t, f, art] of zeilen) {
    if (t) { z.text(T, y, t, 14, "start", art || "text", !!f); y += 20; } else y += 8;
  }
  unten = Math.max(unten, y - 16);

  // ---------------- Legende ----------------
  const legende = [["holz_hirn", "Holz, Hirnholz"], ["@spann", "BSP-Lage, Faser in Zeichenebene"], ["beton", "Stahlbeton"],
    ...(t_x > 0 ? [["elastomer", "elastisches Lager"]] : []), ["daemm", "Randdämmstreifen"], ["schraube", "Stahl, Schrauben"]];
  const yl = z.legende(legende, 20, unten + 16, 672);
  z.h = yl + 8;
  return z;
}

// Größte Lücke in [a, b] neben belegten Intervallen [[u, v], …]
function groessteLuecke(a, b, belegt) {
  let best = null, pos = a;
  for (const [u, v] of [...belegt].sort((p, q) => p[0] - q[0]).concat([[b, b]])) {
    if (Math.min(u, b) - pos > (best ? best[1] - best[0] : 0)) best = [pos, Math.min(u, b)];
    pos = Math.max(pos, v);
  }
  return best;
}

function balkenLaenge(m) {
  for (const l of [20, 50, 100, 200, 250, 500, 1000, 2000]) if (l / m >= 40) return l;
  return 2000;
}
