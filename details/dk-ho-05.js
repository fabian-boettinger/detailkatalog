// DK-HO-05 HBV-Decke seitlich an BSH-Unterzug, Spannrichtung parallel
// Port von dk_ho_05() (Detailkatalog Generator, 13.11.2026), parametrisch.
import { Zeichnung, massstab, waehleMassstab, fmt, ANNAHME_ETA, laengsLagen, bspTyp } from "../js/dk.js";
import { NADELHOLZ, BRETTSCHICHTHOLZ, BAUBUCHE, BSP_LAGENFOLGE, bauteilName, werkstoffHinweis } from "../js/werkstoffe.js";
import { HOLZ, KMOD, EC5 } from "../js/holzbau.js";
import { SCHRAUBEN_OPTIONEN, BSP_OPTIONEN, KLED_OPTIONEN, bspKennwerte, axRd, ftRdEta, sortimentHinweis, kmodText } from "../js/hersteller.js";

export const meta = {
  id: "DK-HO-05",
  titel: "HBV-Decke seitlich an BSH-Unterzug, Spannrichtung parallel",
  kategorie: "Holzbau-Anschlüsse",
  beschreibung:
    "BSH-Unterzug mit beidseitig stumpf angrenzender HBV-Decke (BSP + Aufbeton), OK Aufbeton = OK BSH. " +
    "Decklagen des BSP parallel zum Unterzug (senkrecht zur Zeichenebene). " +
    "Die Decke spannt parallel zum Unterzug und gibt keine planmäßige Last an ihn ab. " +
    "Konstruktive Verschraubung: Vollgewindeschrauben schräg von der BSP-Oberseite durch die Stirn in den BSH, " +
    "je Seite im Raster e, Seiten um e/2 versetzt; Trennlage zwischen Aufbeton und BSH. " +
    "Unterzug aus Brettschichtholz (GL24c … GL32h) oder BauBuche GL75. " +
    "Standard: BSH 200/800 GL24h, BSP 240 (C24) + 80 mm Aufbeton, VG Ø8 × 280 unter 45°. " +
    "Schematische Ausführungsvariante, Verbindungsmittel nach ETA/Hersteller.",
  nachweise: [
    "Lagesicherung, Fugenschluss: Schrauben auf Abscheren/Herausziehen für konstruktive Kräfte (Montage, Schwinden, Toleranzen)",
    "Falls Scheibenkräfte oder Kippaussteifung des BSH über die Decke laufen: Schub in der Fuge planmäßig nachweisen, Schraubenanzahl danach",
    "Schrauben im BSP: Eintritt Seitenfläche, Austritt Schmalfläche; Abstände und Einschraubtiefen nach ETA (BSP und Schraube)",
    "Schrauben im BSH bzw. in der BauBuche: Einschraubtiefe l_{ef}, Winkel zur Faser, Abstände nach ETA; BauBuche: Vorbohren und Abstände nach ETA für Buche-FSH",
    "Verformungsverträglichkeit: Durchbiegung Decke und Unterzug unterschiedlich – Schrauben dürfen keine planmäßige Last anziehen (ggf. weicher Anschluss)",
    "BSH: Kippen und Torsion, falls die Decke ihn nicht seitlich hält; Brandschutz Abbrand seitlich bis UK Decke",
    "Montage: Schrauben vor dem Betonieren setzen; Trennlage BSH/Aufbeton, Feuchteschutz Holz",
  ],
  vorschau: { x0: 370, x1: 672 }, // Ausschnitt für die Kachel (px)
  faustwerte: ["[[HEB-Träger auf BSP-Wand – Auflager und Lagesicherung]]: Schrauben in der Schmalseite BSP (d ≥ 8)"],
};

export const parameter = [
  { key: "unterzug", label: "Querschnitt", typ: "profil", reihe: "BSH", standard: "BSH 200/800", fuellt: { b: "b_u", h: "h_u" }, gruppe: "Unterzug", weitere: true },
  { key: "b_u", label: "Breite b", typ: "zahl", einheit: "mm", standard: 200, min: 100, max: 400, gruppe: "Unterzug" },
  { key: "h_u", label: "Höhe h", typ: "zahl", einheit: "mm", standard: 800, min: 300, max: 2400, gruppe: "Unterzug" },
  { key: "klasse_u", label: "Festigkeitsklasse", typ: "auswahl", standard: "GL24h", optionen: [...BRETTSCHICHTHOLZ, ...BAUBUCHE], gruppe: "Unterzug" },
  // Katalogaufbauten haben Decklagen in Haupttragrichtung; die Decke spannt ∥ Unterzug, also senkrecht zur Zeichenebene → 90°
  { key: "bsp", label: "BSP-Aufbau", typ: "profil", reihe: "BSP", standard: "BSP L5 240 (40-40-80-40-40)",
    fuellt: { lagen: "lagen", aufbau: "aufbau", decklage: ["richtung", (v) => (v === "quer" ? 0 : 90), false] }, gruppe: "Decke" },
  { key: "lagen", label: "Lagen von oben", typ: "lagen", einheit: "mm", standard: "40-40-80-40-40", gruppe: "Decke", weitere: true, hilfe: "z. B. 40-40-80-40-40" },
  { key: "aufbau", label: "Lagenfolge", typ: "auswahl", standard: "abwechselnd", optionen: BSP_LAGENFOLGE, gruppe: "Decke", weitere: true },
  { key: "richtung", label: "Decklagenrichtung", typ: "auswahl", standard: 90, gruppe: "Decke", weitere: true,
    optionen: [{ wert: 0, text: "0° – Faser in der Zeichenebene" }, { wert: 90, text: "90° – Faser senkrecht zur Zeichenebene" }] },
  { key: "klasse_bsp", label: "BSP-Lamellen", typ: "auswahl", standard: "C24", optionen: NADELHOLZ, gruppe: "Decke", weitere: true },
  { key: "bsp_hst", label: "BSP-Hersteller", typ: "auswahl", standard: "allgemein", optionen: BSP_OPTIONEN, gruppe: "Decke", weitere: true },
  { key: "h_c", label: "Aufbeton h_{c}", typ: "zahl", einheit: "mm", standard: 80, min: 50, max: 200, gruppe: "Decke" },
  { key: "schraube", label: "Vollgewindeschraube", typ: "profil", reihe: "VG", standard: "VG Ø8 × 280", fuellt: { d: "d", L: "L" }, gruppe: "Verschraubung" },
  { key: "hst", label: "Hersteller", typ: "auswahl", standard: "norm", optionen: SCHRAUBEN_OPTIONEN, gruppe: "Verschraubung" },
  { key: "d", label: "Durchmesser d", typ: "zahl", einheit: "mm", standard: 8, min: 6, max: 14, gruppe: "Verschraubung", weitere: true },
  { key: "L", label: "Länge L", typ: "zahl", einheit: "mm", standard: 280, min: 60, max: 1000, gruppe: "Verschraubung", weitere: true },
  { key: "alpha", label: "Winkel α zur BSP-Oberfläche", typ: "zahl", einheit: "°", standard: 45, min: 30, max: 60, gruppe: "Verschraubung", weitere: true },
  { key: "e_in", label: "Eintritt e_{in} ab Stirn", typ: "zahl", einheit: "mm", standard: 100, min: 20, max: 400, gruppe: "Verschraubung", weitere: true },
  { key: "e", label: "Raster e je Seite", typ: "zahl", einheit: "mm", standard: 500, min: 100, max: 2000, gruppe: "Verschraubung", weitere: true },
  { key: "kled", label: "Lasteinwirkungsdauer", typ: "auswahl", standard: "mittel", optionen: KLED_OPTIONEN, gruppe: "Bemessung", weitere: true },
];

// Testvarianten für werkzeug/pruefe.mjs (Layout muss bei allen halten)
export const varianten = [
  { name: "gross", roh: { unterzug: "BSH 280/1600", h_c: "120", bsp: "BSP L7 280 (40-40-40-40-40-40-40)", schraube: "VG Ø10 × 400", e_in: "140" } },
  { name: "klein", roh: { unterzug: "BSH 120/480", bsp: "BSP L3 120 (40-40-40)", h_c: "60", schraube: "VG Ø6 × 200", e_in: "60" } },
  { name: "steil", roh: { alpha: "60", e_in: "60", schraube: "VG Ø8 × 240" } },
  { name: "flach", roh: { alpha: "30", e_in: "150", schraube: "VG Ø8 × 330" } },
  { name: "grenzen", roh: { b_u: "400", h_u: "2400", h_c: "200", lagen: "40-40-40-40-40-40-40", d: "12", L: "1000", e_in: "400", alpha: "30" } },
  { name: "min", roh: { b_u: "100", h_u: "300", h_c: "50", lagen: "20-20-20", d: "6", L: "60", e_in: "20", alpha: "60" } },
  { name: "decklage0", roh: { richtung: "0" } },
  { name: "baubuche", roh: { klasse_u: "GL75", b_u: "160", h_u: "800" } },
  { name: "decklage0_L7", roh: { richtung: "0", bsp: "BSP L7 280 (40-40-40-40-40-40-40)" } },
  { name: "decklage90_L3", roh: { bsp: "BSP L3 100 (30-40-30)" } },
  { name: "doppellagen", roh: { bsp: "BSP L8s 300 (40-40-30-40-40-30-40-40)", h_u: "1400" } },
  { name: "niedrig", roh: { b_u: "200", h_u: "400" } },
  { name: "wuerth", roh: { hst: "assy", schraube: "VG Ø10 × 300" } },
  { name: "vgz_stora", roh: { hst: "vgz", schraube: "VG Ø9 × 280", bsp_hst: "storaenso", kled: "kurz" } },
  { name: "vgz_baubuche", roh: { hst: "vgz", schraube: "VG Ø9 × 280", klasse_u: "GL75", b_u: "160" } },
  { name: "niedrig_breit", roh: { b_u: "400", h_u: "300", h_c: "120" } },
];

const LAMELLE = 40; // BSH-Lamellendicke für die Darstellung
const LAMELLE_BSP = 150; // Lamellenbreite der BSP-Lagen für die Hirnholzdarstellung

// Größte Lücke in [a, b] neben belegten Intervallen [[u, v], …]
function groessteLuecke(a, b, belegt) {
  let best = null, pos = a;
  for (const [u, v] of [...belegt].sort((p, q) => p[0] - q[0]).concat([[b, b]])) {
    if (Math.min(u, b) - pos > (best ? best[1] - best[0] : 0)) best = [pos, Math.min(u, b)];
    pos = Math.max(pos, v);
  }
  return best;
}

// BSH im Querschnitt: Hirnholz je Lamelle (unterste ggf. angeschnitten), außen Kontur
// stil: "holz_hirn" (BSH, Jahresringe) oder "holz_fsh" (BauBuche, Furniere waagerecht)
function bshLamellen(z, x, y, w, h, lam, stil = "holz_hirn") {
  if (lam < 4) z.rect(x, y, w, h, stil, 0.4);
  else for (let yy = 0; yy < h - 0.5; yy += lam) z.rect(x, y + yy, w, Math.min(lam, h - yy), stil, 0.4);
  z.kontur(x, y, w, h, 1.2);
}

export function zeichne(p, opt = {}) {
  const z = new Zeichnung(940, 500, { messe: opt.messe });
  const M = (s) => z.messe(s, 14, false);

  // ---------------- Abmessungen (mm) ----------------
  const { b_u, h_u, h_c, d, L, alpha, e_in, e } = p;
  const lagen = p.lagen;
  const richtung = Number(p.richtung);
  const nameU = bauteilName(p.klasse_u); // "BSH" oder "BauBuche"
  const stilU = nameU === "BauBuche" ? "holz_fsh" : "holz_hirn";
  const h_b = lagen.reduce((a, b) => a + b, 0);
  const laengs = laengsLagen(lagen.length, p.aufbau);
  const xe = b_u / 2;
  const t_tr = 4; // Trennlage Aufbeton/Unterzug (Holz an Beton); zwischen Aufbeton und BSP keine (HBV)
  const TR_MIN = 3; // Trennlage mindestens 3 px breit zeichnen, damit sie sichtbar bleibt
  const c = Math.cos((alpha * Math.PI) / 180), s = Math.sin((alpha * Math.PI) / 180), tn = Math.tan((alpha * Math.PI) / 180);

  // Schraube links: Eintritt an OK BSP, e_in vor der Stirn, Richtung zur Stirn nach unten
  const y_aus = e_in * tn; // Austritt Stirn unter OK BSP
  const l_bsp = e_in / c; // Länge im BSP
  const l_ef = L - l_bsp; // Einschraubtiefe im BSH
  const spitze = { x: -(xe + e_in) + L * c, y: h_c + L * s }; // Spitze (links), x ab Trägerachse

  // ---------------- Prüfungen (mm) ----------------
  // Alle Sollwerte sind Annahmen (übliche ETA-Werte), keine Normwerte
  z.pruefe("BSP: Eintritt – Stirnkante a_{4,c} (≥ 6d)", e_in, 6 * d, ANNAHME_ETA);
  z.pruefe("BSP: Austritt Stirn – OK BSP (≥ 3d)", y_aus, 3 * d, ANNAHME_ETA);
  z.pruefe("BSP: Austritt Stirn – UK BSP (≥ 3d)", h_b - y_aus, 3 * d, ANNAHME_ETA);
  z.pruefe(`${nameU}: Einschraubtiefe l_{ef} (≥ 100)`, l_ef, 100, ANNAHME_ETA);
  z.pruefe(`${nameU}: Austritt – OK ${nameU} (≥ 4d)`, h_c + y_aus, 4 * d, ANNAHME_ETA);
  z.pruefe(`${nameU}: Spitze vor Gegenseite (≥ 4d)`, b_u - Math.max(l_ef, 0) * c, 4 * d, ANNAHME_ETA);
  z.pruefe(`${nameU}: Spitze über UK ${nameU} (≥ 4d)`, h_u - spitze.y, 4 * d, ANNAHME_ETA);
  z.pruefe(`${nameU}: UK unter UK Decke (≥ 0)`, h_u - (h_c + h_b), 0, "geometrisch");

  // ---------------- Tragfähigkeit (überschlägig): Herausziehen je Schraube ----------------
  const Gax = "F_{ax,Rd}";
  const kmod = KMOD[p.kled];
  const tQ = Math.max(...lagen.filter((_, i) => !laengs[i]), 0);
  const bk = bspKennwerte(p.bsp_hst, p.klasse_bsp, tQ);
  // Winkel Schraubenachse – Faser: BSP mit Decklagen in der Zeichenebene α, sonst 90°; BSH-Faser senkrecht zur Zeichenebene
  const aBsp = richtung === 0 ? alpha : 90;
  const rBsp = axRd(p.hst, d, l_bsp, p.klasse_bsp, aBsp, kmod, bk.rho);
  const rU = axRd(p.hst, d, l_ef, p.klasse_u, 90, kmod);
  z.widerstand(Gax, `Herausziehen im BSP, l_{ef} = ${fmt(Math.round(l_bsp))} mm, k_{mod} = ${kmodText(p.kled)}`, rBsp.Rd, "kN",
    p.bsp_hst === "allgemein" ? rBsp.quelle : `${rBsp.quelle}; ρ_{k} = ${bk.rho} nach ${bk.quelle}`);
  z.widerstand(Gax, `Herausziehen im ${nameU}, l_{ef} = ${fmt(Math.round(Math.max(l_ef, 0)))} mm`, rU.Rd, "kN",
    HOLZ[p.klasse_u].art === "fsh" && p.hst === "norm" ? `${rU.quelle}; BauBuche: ρ_{k} auf 500 begrenzt, ETA maßgebend` : rU.quelle);
  const ft = ftRdEta(p.hst, d);
  if (ft) z.widerstand(Gax, "Zugtragfähigkeit der Schraube", ft.Rd, "kN", ft.quelle);
  const Fax = Math.min(...z.widerstaende.map((w) => w.wert));
  z.widerstand("f_{ax,Rd}", `je m Fuge und Seite (Raster e = ${fmt(e)} mm)`, (Fax * 1000) / e, "kN/m", "aus F_{ax,Rd}");
  z.tragHinweise.push("Konstruktive Verbindung: Werte zeigen die Größenordnung der Lagesicherung, keine planmäßige Lastabtragung");
  const sh = sortimentHinweis(p.hst, d);
  if (sh) z.tragHinweise.push(sh);
  if (!ft) z.tragHinweise.push("Zugtragfähigkeit des Stahls und günstigere Ausziehwerte nach ETA: Hersteller wählen");

  // ---------------- Querschnitt, maßstäblich, Feld x 0…300 ----------------
  z.titel(20, 26, "Querschnitt");
  const xl = 60, xr = 244, xa = (xl + xr) / 2, y0 = 70;
  const s1 = waehleMassstab(Math.max(h_u / 320, b_u / 70, (h_c + h_b) / 90));
  const Q = massstab(xa, y0, s1);
  const bu1 = Q.px(b_u), hc1 = Q.px(h_c), hb1 = Q.px(h_b), hu1 = Q.px(h_u);
  const lagenQ = lagen.map((t) => Q.px(t));
  const x_end = xe + e_in + 50; // Decke im Detail bis 50 mm hinter dem Schraubeneintritt (Platz für Symbole)
  const rx0 = Math.max(xl - 4, Q.X(-x_end)), rx1 = Math.min(xr + 4, Q.X(x_end)); // Detailrahmen
  const trQ = Math.max(Q.px(t_tr), TR_MIN); // Trennlage Aufbeton/Unterzug
  for (const [x1, x2, symbole] of [[xl, xa - bu1 / 2, false], [xa + bu1 / 2, xr, true]]) {
    const links = x2 < xa;
    z.rect(links ? x1 : x1 + trQ, y0, x2 - x1 - trQ, hc1, "beton", 1.0);
    z.rect(links ? x2 - trQ : x1, y0, trQ, hc1, "daemm", 0.5);
    // Spannrichtungssymbole nur rechts; links laufen die Hinweislinien durch die Decke
    const frei = (i, a, b) => (symbole ? groessteLuecke(a, b, [[rx0 - 3, rx0 + 3], [rx1 - 3, rx1 + 3]]) : null);
    z.bsp(x1, y0 + hc1, x2 - x1, lagenQ, richtung, { frei, lamellePx: Q.px(LAMELLE_BSP), laengs });
  }
  bshLamellen(z, xa - bu1 / 2, y0, bu1, hu1, Q.px(LAMELLE), stilU);
  for (const x of [xl, xr]) z.linie(x, y0 - 6, x, y0 + hc1 + hb1 + 6, "mass", 1.0, "6 3");

  // Detailausschnitt (Bereich des rechten Feldes) als Rahmen
  const tiefe = Math.max(spitze.y + 60, h_c + h_b + 80);
  const y_ub = Math.min(h_u, tiefe); // gezeigte Tiefe des BSH
  const bsh_ganz = y_ub >= h_u - 1e-6;
  z.rahmen(rx0, y0 - 4, rx1 - rx0, Q.px(y_ub) + 8);
  z.text(rx0, y0 - 8, "Detail", 14, "start", "mass");

  // Maße
  z.massV([y0, y0 + hc1, y0 + hc1 + hb1], xl - 14, [fmt(h_c), fmt(h_b)], [[y0, xl], [y0 + hc1, xl], [y0 + hc1 + hb1, xl]], "links");
  z.massV([y0, y0 + hu1], xr + 12, [fmt(h_u)], [[y0, xa + bu1 / 2], [y0 + hu1, xa + bu1 / 2]]);
  const yb = y0 + hu1 + 24;
  z.massH([xa - bu1 / 2, xa + bu1 / 2], yb, [fmt(b_u)], [[xa - bu1 / 2, y0 + hu1], [xa + bu1 / 2, y0 + hu1]]);

  // Beschriftung links unter der Decke, an die Unterkante der Decke gekoppelt
  // Texte beginnen unter der Decke bzw. unter dem Detailrahmen, je nachdem was tiefer liegt
  const rahmenUnten = y0 - 4 + Q.px(y_ub) + 8;
  const ly = Math.max(y0 + hc1 + hb1, rahmenUnten - 14);
  const xt = 20;
  // BSP oben, Aufbeton darunter; die Linie zum Aufbeton läuft rechts am BSP-Text vorbei
  const bb = z.hinweis(xl + 8, y0 + hc1 + hb1 / 2, `BSP ${fmt(h_b)} ${bspTyp(lagen, p.aufbau)}`, xt, ly + 40);
  const tA = `Aufbeton ${fmt(h_c)}`; // Linie senkrecht rechts an beiden Texten vorbei
  const zxA = Math.max(bb.x1 + 6, xt + M(tA) + 3); // Text rechtsbündig an der senkrechten Linie
  z.hinweis(zxA, y0 + hc1 / 2, tA, zxA - 3 - M(tA), ly + 62);
  z.text(xt, ly + 90, "Spannrichtung", 14);
  z.text(xt, ly + 108, "∥ Unterzug", 14);
  // Bezeichnung des Unterzugs unter dem Breitenmaß; bei niedrigem Unterzug läge sie im Textblock
  // links (bzw. die Hinweislinien liefen durch sie) – dann unter den Textblock
  const yu = ly + 26 < yb + 22 + 6 && ly + 108 + 6 > yb - 18 ? Math.max(ly + 108 + 26, yb + 22) : yb + 22;
  z.text(xa, yu, `${nameU} ${fmt(b_u)}/${fmt(h_u)} ${p.klasse_u}`, 14, "middle", "titel", true);
  let unten = Math.max(yu, ly + 108);
  const bq = z.massstabBalken(20, unten + 18, s1, balkenLaenge(s1));
  unten = bq.y1;

  // ---------------- Detail, maßstäblich, Feld x 370…672 ----------------
  z.titel(380, 26, "Detail Anschluss");
  const textV = Math.max(M(fmt(h_c)), M(fmt(h_b)));
  const fl = 372 + textV + 6 + 8, fr = 670; // Platz links für die Maßkette h_c / h_b
  const yo = 105, hoeheMax = 300;
  const m = waehleMassstab(Math.max((2 * x_end) / (fr - fl), y_ub / hoeheMax), [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8]);
  const D = massstab((fl + fr) / 2, yo, m);
  const { X, Y } = D, P = D.px;
  const y_ok = h_c, y_uk = h_c + h_b;

  // Schraubenachse (mm): Punkt bei Länge l ab Eintritt, sg = −1 links, +1 rechts
  const punkt = (sg, l) => ({ x: sg * (xe + e_in) - sg * l * c, y: y_ok + l * s });
  const mitte = Math.min(l_bsp, L) / 2; // Zielpunkt der Hinweislinien auf den Schrauben
  // Freier Bereich einer BSP-Lage für das Spannrichtungssymbol: größte Lücke neben Schraube
  // (mit Kopf) und senkrechter Hinweislinie
  const lagenOben = lagen.map((_, i) => y_ok + lagen.slice(0, i).reduce((u, v) => u + v, 0));
  const freiIn = (sg) => (i, a, b) => {
    const yt = lagenOben[i], yb = yt + lagen[i];
    const belegt = [];
    const y1 = Math.max(yt, y_ok), y2 = Math.min(yb, y_ok + Math.min(y_aus, L * s));
    if (y2 > y1) {
      const xs = [y1, y2].map((yy) => X(punkt(sg, (yy - y_ok) / s).x));
      const rand = P(d) / (2 * s) + 2;
      const kopf = yt <= y_ok + 1e-6 ? 5 : 0; // Kopfstrich nur auf der Eintrittsseite
      const [u, v] = [Math.min(...xs), Math.max(...xs)];
      // Eintritt liegt außen: links bei u, rechts bei v
      belegt.push(sg < 0 ? [u - rand - kopf, v + rand] : [u - rand, v + rand + kopf]);
    }
    const q = punkt(sg, mitte);
    if (yb > q.y) belegt.push([X(q.x) - 4, X(q.x) + 4]);
    return groessteLuecke(a, b, belegt);
  };

  // Decke beidseitig
  const trD = Math.max(t_tr, TR_MIN * m); // gezeichnete Trennlagendicke in mm
  for (const sg of [-1, 1]) {
    let [a, b] = [sg * (xe + trD), sg * x_end].sort((u, v) => u - v);
    z.rect(X(a), Y(0), P(b - a), P(h_c), "beton", 1.0);
    [a, b] = [sg * xe, sg * x_end].sort((u, v) => u - v);
    z.bsp(X(a), Y(y_ok), P(b - a), lagen.map(P), richtung, { frei: freiIn(sg), lamellePx: P(LAMELLE_BSP), laengs });
    const [t0] = [sg * xe, sg * (xe + trD)].sort((u, v) => u - v);
    z.rect(X(t0), Y(0), P(trD), P(h_c), "daemm", 0.5);
    // Bewehrung schematisch
    const yb2 = Math.min(30, h_c / 2);
    const [m0, m1] = [sg * (xe + 20), sg * (x_end - 8)].sort((u, v) => u - v);
    z.linie(X(m0), Y(yb2), X(m1), Y(yb2), "text", 1.4);
    const schritt = 25 * Math.ceil((8 * m) / 25); // Punkte mind. 8 px auseinander
    for (let xx = m0 + 10; xx < m1; xx += schritt) z.kreis(X(xx), Y(yb2) + 3, 1.8, "schraube", 0.4);
    z.linie(X(sg * x_end), Y(-10), X(sg * x_end), Y(y_uk + 10), "mass", 1.0, "6 3");
  }
  bshLamellen(z, X(-xe), Y(0), P(b_u), P(y_ub), P(LAMELLE), stilU);
  if (!bsh_ganz) z.linie(X(-xe) - 10, Y(y_ub), X(xe) + 10, Y(y_ub), "mass", 1.0, "6 3");

  // Schrauben: links vorn, rechts um e/2 versetzt (hinter der Schnittebene)
  for (const sg of [-1, 1]) {
    const a = punkt(sg, 0), b = punkt(sg, L);
    z.stabSchraeg(X(a.x), Y(a.y), X(b.x), Y(b.y), P(d), sg < 0 ? "schraube" : "schraube_hinten");
    const nx = s, ny = sg * c; // senkrecht zur Schraubenachse: Kopf
    z.linie(X(a.x) - nx * 6, Y(a.y) + ny * 6, X(a.x) + nx * 6, Y(a.y) - ny * 6, "text", 2.0);
  }

  // Maßkette oben: e_in | b | e_in, Beschriftung lang oder kurz je nach Platz
  const ym = 72;
  const xs = [X(-xe - e_in), X(-xe), X(xe), X(xe + e_in)];
  const lb = fmt(b_u), wb = M(lb);
  const lang = `a_{4,c} = ${fmt(e_in)}`, hw = M(lang) / 2;
  const cl = (xs[0] + xs[1]) / 2, cm = (xs[1] + xs[2]) / 2, cr = (xs[2] + xs[3]) / 2;
  const passt = cl - hw >= 372 && cl + hw <= cm - wb / 2 - 6 && cr + hw <= fr + 2 && cr - hw >= cm + wb / 2 + 6;
  const la = passt ? lang : "a_{4,c}";
  z.massH(xs, ym, [la, lb, la], [[xs[0], Y(y_ok) - 4], [xs[1], Y(0) - 3], [xs[2], Y(0) - 3], [xs[3], Y(y_ok) - 4]]);
  z.massV([Y(0), Y(y_ok), Y(y_uk)], X(-x_end) - 8, [fmt(h_c), fmt(h_b)], null, "links");

  // Beschriftung unter dem BSH-Ausschnitt, an die Schrauben gekoppelt
  const yBSH = Y(y_ub) + 20;
  z.text(X(0), yBSH, `${nameU} ${p.klasse_u}`, 14, "middle", "titel", true);
  const ty = yBSH + 26;
  const qL = punkt(-1, mitte), qR = punkt(1, mitte);
  const bl = z.hinweis(X(qL.x), Y(qL.y), `VG Ø${fmt(d)} × ${fmt(L)}, ${fmt(alpha)}°`, Math.max(374, X(-x_end)), ty, "start", ["vor Betonage"]);
  const br = z.hinweis(X(qR.x), Y(qR.y), "versetzt", Math.min(670, X(x_end)), ty, "end", ["(um e/2)"]);
  const bd = z.massstabBalken(Math.max(374, X(-x_end)), Math.max(bl.y1, br.y1) + 14, m, balkenLaenge(m));
  unten = Math.max(unten, bd.y1);

  // ---------------- Text, Feld ab x = 712 ----------------
  const T = 712;
  z.titel(T, 26, "Seitlicher Anschluss");
  const ok = (a, b) => (a >= b - 0.05 ? "≥" : "<");
  let ys = 0, lage = lagen.length;
  for (let i = 0; i < lagen.length; i++) { if (y_aus <= ys + lagen[i]) { lage = i + 1; break; } ys += lagen[i]; }
  const lageText = lagen.length % 2 === 1 && lage === (lagen.length + 1) / 2 ? `Mittellage ${fmt(lagen[lage - 1])}` : `Lage ${lage}, ${fmt(lagen[Math.min(lage, lagen.length) - 1])}`;
  const zeilen = [
    [`OK Aufbeton = OK ${nameU},`], [`Trennlage Aufbeton/${nameU}`], ["Decke spannt ∥ Unterzug,"], ["keine planmäßige Auflast"],
    [`BSP-Decklagen ${richtung === 90 ? "∥" : "⊥"} Unterzug`], [`${nameU} ${p.klasse_u}, BSP ${p.klasse_bsp}`], [""],
    ["Konstruktive Verschraubung:", true], [`VG Ø${fmt(d)} × ${fmt(L)}, ${fmt(alpha)}° von`], ["BSP-Oberseite durch die"],
    [`Stirn in den ${nameU}`], [`je Seite e ≈ ${fmt(e)} mm,`], ["Seiten um e/2 versetzt"], [""],
    [`Abstände (d = ${fmt(d)}):`, true], [`BSP: a_{4,c} = ${fmt(e_in)} ${ok(e_in, 6 * d)} 6d`],
    [`Austritt Stirn ${fmt(Math.round(y_aus))} unter`], [`OK BSP (${lageText})`],
    [`${nameU}: l_{ef} ≈ ${fmt(Math.round(l_ef))} ${ok(l_ef, 100)} 100`], [""],
    ["Abstände nach ETA prüfen", true],
    ...(werkstoffHinweis(p.klasse_u) ? [["BauBuche: Vorbohren und"], ["Abstände nach ETA (Buche)"]] : []),
    [`Maßstab Detail 1 px = ${fmt(m)} mm`, false, "mass"], [`Querschnitt 1 px = ${fmt(s1)} mm`, false, "mass"],
  ];
  let y = 50;
  for (const [t, f, art] of zeilen) {
    if (t) { z.text(T, y, t, 14, "start", art || "text", !!f); y += 20; } else y += 8;
  }
  unten = Math.max(unten, y - 20 + 4);

  // ---------------- Legende unter dem Querschnitt ----------------
  const legende = [["beton", "Stahlbeton"], ["holz_hirn", "Holz, Hirnholz"],
    ...(stilU === "holz_fsh" ? [["holz_fsh", "BauBuche, Furnierlagen"]] : []), ["@spann", "BSP-Lage, Faser in Zeichenebene"],
    ["schraube", "Schraube"], ["schraube_hinten", "Schraube, versetzt (hinten)"], ["daemm", "Trennlage"]];
  const yl = z.legende(legende, 20, unten + 14, 300);
  z.h = yl + 8;
  return z;
}

// Länge des Maßstabsbalkens: glatte Länge mit 40…100 px
function balkenLaenge(m) {
  for (const l of [20, 50, 100, 200, 250, 500, 1000, 2000]) if (l / m >= 40) return l;
  return 2000;
}
