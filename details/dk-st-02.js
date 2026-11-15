// DK-ST-02 Gelenkiger Trägeranschluss mit kurzer Stirnplatte
// Nachbau des Artefakt-Details (schematisch) als maßstäbliches, parametrisches Detail.
import { Zeichnung, massstab, waehleMassstab, fmt } from "../js/dk.js";
import {
  STAHL, STAHL_OPTIONEN, SCHRAUBEN, schraubenOptionen, FESTIGKEIT_OPTIONEN, EC3, fvRd, fbRd, fwRd, vplRd,
  PROFIL_I, profilMasse, profilFuellt, profilAus,
  reiheEinpassen, reiheMeldungen, wurzelmass, wurzelMeldungen, plattenRand, stuetzeSichtbar,
} from "../js/stahlbau.js";

export const meta = {
  id: "DK-ST-02",
  titel: "Gelenkiger Trägeranschluss mit kurzer Stirnplatte",
  kategorie: "Stahl-Anschlüsse",
  beschreibung:
    "Kurze Stirnplatte an den Trägersteg geschweißt, mit dem Stützenflansch verschraubt (zwei Schraubenreihen). " +
    "Querkraftanschluss, gelenkig durch dünne Stirnplatte. Standard: Stütze HEB 240, Träger IPE 300, Stirnplatte 10 mm, " +
    "2 × 3 M20 8.8, S235. Schraubenzahl, Lochabstand, Wurzelmaß und Plattengröße passen sich Träger und Stütze an " +
    "(gerader Stegteil des Trägers, Scheiben frei neben Steg und Ausrundung der Stütze, Randabstand im Stützenflansch), " +
    "solange sie nicht vorgegeben sind. Randabstände und Tragfähigkeit werden aus den Werten ermittelt.",
  nachweise: [
    "Schrauben: Abscheren und Lochleibung in Stirnplatte und Stützenflansch",
    "Kehlnähte Steg an Stirnplatte (V_{Ed})",
    "Stirnplatte: Schub, Blockversagen",
    "Trägersteg im Anschlussbereich: Schub",
    "Rotationsfähigkeit: dünne Stirnplatte (gelenkiges Verhalten), Stirnplatte endet unter dem Druckflansch",
  ],
  vorschau: { x0: 0, x1: 300 }, // Ausschnitt für die Kachel (px)
  faustwerte: ["Schrauben Stahlbau", "Schweißnähte", "Stirn- und Fußplatten"],
};

export const parameter = [
  { key: "stuetze", label: "Stütze", typ: "profil", reihe: PROFIL_I, standard: "HEB 240", gruppe: "Profile", fuellt: profilFuellt("s") },
  { key: "traeger", label: "Träger", typ: "profil", reihe: PROFIL_I, standard: "IPE 300", gruppe: "Profile", fuellt: profilFuellt("t") },
  ...profilMasse("s", "Profile"), ...profilMasse("t", "Profile"),
  { key: "schraube", label: "Schrauben", typ: "auswahl", standard: "M20", optionen: schraubenOptionen(["M12", "M16", "M20", "M24"]), gruppe: "Anschluss" },
  { key: "n", label: "Reihen n (je 2 Schrauben)", typ: "zahl", einheit: "", standard: 0, min: 2, max: 8, auto: true, gruppe: "Anschluss", hilfe: "leer = automatisch (Plattenhöhe ≥ 0,6 h)" },
  { key: "t_p", label: "Stirnplatte t_{p}", typ: "zahl", einheit: "mm", standard: 10, min: 8, max: 25, gruppe: "Anschluss" },
  { key: "p1", label: "Lochabstand p_{1}", typ: "zahl", einheit: "mm", standard: 0, min: 30, max: 200, auto: true, gruppe: "Anschluss", weitere: true, hilfe: "leer = automatisch (3 d₀, bei wenig Steghöhe kleiner)" },
  { key: "w", label: "Wurzelmaß w", typ: "zahl", einheit: "mm", standard: 0, min: 40, max: 300, auto: true, gruppe: "Anschluss", weitere: true, hilfe: "leer = automatisch (aus Steg, Naht, Ausrundung der Stütze)" },
  { key: "fk", label: "Festigkeitsklasse", typ: "auswahl", standard: "8.8", optionen: FESTIGKEIT_OPTIONEN, gruppe: "Werkstoff", weitere: true },
  { key: "stahl", label: "Stahlsorte", typ: "auswahl", standard: "S235", optionen: STAHL_OPTIONEN, gruppe: "Werkstoff", weitere: true },
];

export const varianten = [
  { name: "klein", roh: { stuetze: "HEA 140", traeger: "IPE 200", schraube: "M16", n: "2", p1: "60", t_p: "8" } },
  { name: "gross", roh: { stuetze: "HEB 400", traeger: "IPE 500", schraube: "M24", n: "5", p1: "75", t_p: "15", stahl: "S355" } },
  { name: "eng", roh: { p1: "40", w: "50" } },
  // Automatik: Schraubenbild folgt Träger und Stütze
  { name: "auto_ipe160", roh: { traeger: "IPE 160" } },
  { name: "auto_hem", roh: { stuetze: "HEM 300", traeger: "HEA 400" } },
  { name: "auto_breit", roh: { stuetze: "HEA 200", traeger: "HEB 300" } }, // Trägerflansch breiter als die Stütze
  { name: "zu_schmal", roh: { stuetze: "HEA 100" } }, // nicht lösbar mit M20: die Prüfung zeigt es
];

export function zeichne(p, opt = {}) {
  const z = new Zeichnung(940, 400, { messe: opt.messe });
  const S = profilAus(p, "s"), T = profilAus(p, "t");
  const M = p.schraube, { d, d0, dU } = SCHRAUBEN[M];
  const { t_p } = p;
  const st = STAHL[p.stahl];

  // ---------------- abgeleitete Geometrie (mm) ----------------
  const a = Math.max(3, Math.ceil(0.5 * T.tw)); // Kehlnähte Steg – Stirnplatte, beidseitig
  // Wurzelmaß: Scheiben frei neben Trägersteg + Naht und neben Stützensteg + Ausrundung, Rand im Stützenflansch
  const W = wurzelmass({ m: M, w: p.w, twT: T.tw, nahtT: a, S, bMax: S.b });
  const w = W.w;
  if (W.auto) z.auto.w = w;
  const e2 = plattenRand(M, w, S.b), b_p = w + 2 * e2;
  // Schraubenreihen in den geraden Stegteil des Trägers einpassen
  const lichte = T.h - 2 * (T.tf + T.r);
  const R = reiheEinpassen({ m: M, platz: lichte, ziel: 0.6 * T.h, n: p.n, p1: p.p1 });
  const { n, p1, e1, h: h_p } = R;
  if (R.nAuto) z.auto.n = n;
  if (R.pAuto) z.auto.p1 = p1;
  z.anpassungen.push(...reiheMeldungen(R, lichte, "die Stirnplatte"), ...wurzelMeldungen(W, M));
  if (e2 < Math.ceil(1.5 * d0 / 5 - 1e-9) * 5 && b_p <= S.b) z.anpassungen.push(`Randabstand e_{2} der Stirnplatte auf ${fmt(e2)} mm verkleinert, damit die Platte nicht über den Stützenflansch (b = ${fmt(S.b)} mm) steht.`);
  const y_p = (T.h - h_p) / 2; // Plattenoberkante ab OK Träger (mittig im Steg)
  const e2c = (S.b - w) / 2; // Randabstand im Stützenflansch
  const reihen = Array.from({ length: n }, (_, i) => y_p + e1 + i * p1);

  // ---------------- Prüfungen ----------------
  const TAB = `${EC3}, Tab. 3.3`;
  z.pruefe("e_{1} Stirnplatte (≥ 1,2 d_{0})", e1, 1.2 * d0, TAB);
  z.pruefe("p_{1} Lochabstand (≥ 2,2 d_{0})", p1, 2.2 * d0, TAB);
  z.pruefe("e_{2} Stirnplatte (≥ 1,2 d_{0})", e2, 1.2 * d0, TAB);
  z.pruefe("e_{2,c} Stützenflansch (≥ 1,2 d_{0})", e2c, 1.2 * d0, TAB);
  z.pruefe("p_{2} = w (≥ 2,4 d_{0})", w, 2.4 * d0, TAB);
  z.pruefe("Schraube neben der Naht am Trägersteg (w/2 – t_{w}/2 – a√2 ≥ d)", w / 2 - T.tw / 2 - a * Math.SQRT2, d, "Kollisionsprüfung (Schlüsselweite)");
  z.pruefe("Scheibe frei von Steg und Ausrundung der Stütze (w/2 – t_{w,c}/2 – r_{c} ≥ d_{U}/2)", w / 2 - S.tw / 2 - S.r, dU / 2, "Kollisionsprüfung");
  z.pruefe("Stirnplatte im geraden Stegteil, frei von Flansch und Ausrundung (h_{p} ≤ h – 2(t_{f} + r))", lichte - h_p, 0, "Kollisionsprüfung");
  z.pruefe("Stirnplatte nicht breiter als der Stützenflansch", S.b - b_p, 0, "geometrisch");

  // ---------------- Tragfähigkeit V_Rd (überschlägig) ----------------
  const G = "V_{Rd}", nS = 2 * n;
  z.widerstand(G, `Schrauben, Abscheren (${nS} × ${M} ${p.fk})`, nS * fvRd(M, p.fk), "kN", `${EC3}, Tab. 3.4`);
  z.widerstand(G, `Lochleibung Stirnplatte t = ${fmt(t_p)}`, nS * fbRd(M, p.fk, t_p, st.fu, { e1, p1, e2, p2: w }), "kN", `${EC3}, Tab. 3.4`);
  z.widerstand(G, `Lochleibung Stützenflansch t_{f} = ${fmt(S.tf)}`, nS * fbRd(M, p.fk, S.tf, st.fu, { e1: 1e3, p1, e2: e2c, p2: w }), "kN", `${EC3}, Tab. 3.4`);
  z.widerstand(G, `Kehlnähte 2 × a = ${fmt(a)} am Steg`, 2 * h_p * fwRd(a, p.stahl), "kN", `${EC3}, 4.5.3.3`);
  z.widerstand(G, "Trägersteg, Schub über h_{p}", vplRd(T.tw * h_p, p.stahl), "kN", "DIN EN 1993-1-1, 6.2.6");
  z.widerstand(G, "Stirnplatte, Schub (2 Querschnitte, brutto)", vplRd(2 * h_p * t_p, p.stahl), "kN", "DIN EN 1993-1-1, 6.2.6");
  z.tragHinweise.push("Blockversagen der Stirnplatte nicht enthalten", "Gelenkiges Verhalten: Stirnplatte dünn wählen (t_{p} ≤ ca. 0,5 d bei 8.8), Höhe unter dem Druckflansch enden lassen");
  if (h_p < 0.6 * T.h - 1e-9) z.tragHinweise.push(`Stirnplatte niedriger als 0,6 h (${fmt(h_p)} < ${fmt(Math.round(0.6 * T.h))} mm): Träger gegen Verdrehen halten (Decke, Verband)`);

  // ---------------- Ansicht, Feld x 0…300 ----------------
  z.titel(20, 26, "Ansicht");
  const Sv = stuetzeSichtbar(S, T); // tiefe Stützen: nur der Anschlussbereich
  const L_b = Math.max(160, 0.6 * T.h);
  const kopf = 0.65 * d;
  const mA = waehleMassstab(Math.max((Sv + t_p + L_b) / 258, (T.h + 140) / 300), [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6]);
  const yA0 = Math.max(110, 84 + 70 / mA);
  const A = massstab(20 + Sv / mA, yA0, mA), PA = A.px; // x = 0: Außenfläche Stützenflansch
  const yS0 = -70, yS1 = T.h + 70;
  z.iAnsicht(A.X(-Sv), A.Y(yS0), PA(yS1 - yS0), S, PA, { senkrecht: true, teil: Sv });
  for (const yy of [yS0, yS1]) z.linie(A.X(-Sv) - 4, A.Y(yy), A.X(0) + 6, A.Y(yy), "mass", 1.0, "6 3");
  if (Sv < S.h) z.linie(A.X(-Sv), A.Y(yS0) - 4, A.X(-Sv), A.Y(yS1) + 4, "mass", 1.0, "6 3");
  z.rect(A.X(0), A.Y(y_p), PA(t_p), PA(h_p), "ansicht_vorn", 1.2);
  z.iAnsicht(A.X(t_p), A.Y(0), PA(L_b), T, PA);
  z.linie(A.X(t_p + L_b), A.Y(-8), A.X(t_p + L_b), A.Y(T.h + 8), "mass", 1.0, "6 3");
  z.rect(A.X(t_p), A.Y(y_p), Math.max(PA(a), 2.5), PA(h_p), "naht", 0.5);
  for (const yr of reihen)
    z.schraubeSeite({ achseY: A.Y(yr), von: A.X(-S.tf), bis: A.X(t_p), d: PA(d), kopf: [PA(kopf), PA(1.6 * d)], mutter: [PA(0.8 * d), PA(1.6 * d)] });
  // Schnittlinie B–B vor der Stirnplatte
  const xB = A.X(t_p + kopf) + 6;
  z.linie(xB, A.Y(yS0) - 4, xB, A.Y(yS1) + 2, "text", 0.9, "12 3 2 3");
  z.text(xB + 5, A.Y(yS0) + 10, "B", 15, "start", "text", true, { frei: true });
  z.text(xB + 5, A.Y(yS1) - 2, "B", 15, "start", "text", true, { frei: true });
  const xV = Math.max(A.X(t_p + L_b * 0.6), xB + 24); // Kraftpfeil rechts neben dem Schnittbuchstaben
  z.kraft(xV, A.Y(0) - 46, xV, A.Y(0) - 4, "V_{Ed}", xV + 8, A.Y(0) - 24);
  z.text(20, 50, `Stütze ${p.stuetze}`, 14);
  const yT1 = A.Y(Math.max(yS1, y_p + h_p + 20)) + 24;
  z.hinweis(A.X(t_p / 2), A.Y(y_p + h_p) + 1, `Stirnplatte t_{p} = ${fmt(t_p)}`, 20, yT1);
  z.text(A.X(t_p + L_b), yT1 + 22, `Träger ${p.traeger}`, 14, "end");
  const bA = z.massstabBalken(20, yT1 + 40, mA, balkenLaenge(mA));

  // ---------------- Schnitt B–B, Feld x 370…672 ----------------
  z.titel(380, 26, "Schnitt B–B");
  const bMax = Math.max(S.b, T.b, b_p); // breitestes Teil (Trägerflansch kann über die Stütze stehen)
  const yUnten = Math.max(T.h + 30, y_p + h_p + 15), yObenS = Math.min(-30, y_p - 15); // gezeigter Stützenausschnitt
  const mS = waehleMassstab(Math.max(bMax / 190, (yUnten - yObenS) / 300), [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5]);
  const xc = 400 + 26 + bMax / mS / 2; // Trägerachse in px
  const B = massstab(xc, 66 - yObenS / mS, mS), PB = B.px; // y = 0: OK Träger
  z.rect(B.X(-S.b / 2), B.Y(yObenS), PB(S.b), PB(yUnten - yObenS), "ansicht_hinten", 1.0); // Stützenflansch dahinter
  for (const yy of [yObenS, yUnten]) z.linie(B.X(-S.b / 2) - 6, B.Y(yy), B.X(S.b / 2) + 6, B.Y(yy), "mass", 1.0, "6 3");
  z.rect(B.X(-b_p / 2), B.Y(y_p), PB(b_p), PB(h_p), "ansicht_vorn", 1.2);
  z.iProfil(xc, B.Y(T.h / 2), T, PB, "schnitt");
  const aw = Math.max(PB(a), 2);
  for (const sg of [-1, 1]) z.rect(sg < 0 ? B.X(-T.tw / 2) - aw : B.X(T.tw / 2), B.Y(y_p), aw, PB(h_p), "naht", 0.4);
  for (const yr of reihen) for (const sg of [-1, 1]) z.schraubeAnsicht(B.X(sg * w / 2), B.Y(yr), PB(d) / 2);
  // Maße: unten Platte und Stützenflansch (Beschriftung nur, wenn sie zwischen die Hilfslinien passt), rechts Schraubenbild
  // (die schmalere Kette oben, damit keine Hilfslinie durch eine Beschriftung läuft)
  const yb1 = B.Y(yUnten) + 20 + (b_p > S.b ? 26 : 0), yb2 = B.Y(yUnten) + 20 + (b_p > S.b ? 0 : 26);
  z.massH([B.X(-b_p / 2), B.X(-w / 2), B.X(w / 2), B.X(b_p / 2)], yb1, [["e_{2}", ""], ["w", ""], ["e_{2}", ""]],
    [-b_p / 2, -w / 2, w / 2, b_p / 2].map((x) => [B.X(x), B.Y(Math.abs(x) < T.b / 2 ? Math.max(T.h, y_p + h_p) : y_p + h_p) + 2])); // Hilfslinien erst unter dem Trägerflansch
  z.massH([B.X(-S.b / 2), B.X(-w / 2), B.X(w / 2), B.X(S.b / 2)], yb2, [["e_{2,c}", ""], ["w", ""], ["e_{2,c}", ""]],
    [[B.X(-S.b / 2), B.Y(yUnten) + 2], [B.X(S.b / 2), B.Y(yUnten) + 2]]);
  const xm = B.X(bMax / 2) + 14;
  const seg = ["e_{1}", ...reihen.slice(1).map(() => "p_{1}"), "e_{1}"];
  z.massV([B.Y(y_p), ...reihen.map(B.Y), B.Y(y_p + h_p)], xm, seg.map((l, i) => (PB(i === 0 || i === seg.length - 1 ? e1 : p1) >= 16 ? l : "")),
    [[B.Y(y_p), B.X(b_p / 2)], [B.Y(y_p + h_p), B.X(b_p / 2)]]);
  const bS = z.massstabBalken(390, Math.max(yb1, yb2) + 22, mS, balkenLaenge(mS));

  // ---------------- Text ----------------
  const Tx = 712;
  z.titel(Tx, 26, "Kurze Stirnplatte");
  const zeilen = [
    [`Stütze ${p.stuetze}`], [`Träger ${p.traeger}`], [`Stirnplatte ${fmt(b_p)} × ${fmt(h_p)} × ${fmt(t_p)}`], [`2 × ${n} ${M} ${p.fk}, ${p.stahl}`], [`Kehlnähte a = ${fmt(a)} am Steg`], [""],
    ["Abstände (mm):", true], [`e_{1} = ${fmt(e1)}, p_{1} = ${fmt(p1)}`], [`e_{2} = ${fmt(e2)}, w = ${fmt(w)}`], [`e_{2,c} = ${fmt(Math.round(e2c * 10) / 10)} (Stützenflansch)`], [""],
    ["Gelenkig: dünne Stirnplatte,"], ["Platte endet im Stegbereich"], [""],
    [`Ansicht 1 px = ${fmt(mA)} mm`, false, "mass"], [`Schnitt 1 px = ${fmt(mS)} mm`, false, "mass"],
  ];
  let y = 50;
  for (const [t, f, art] of zeilen) { if (t) { z.text(Tx, y, t, 14, "start", art || "text", !!f); y += 20; } else y += 8; }
  const unten = Math.max(bA.y1, bS.y1, y - 16);
  const yl = z.legende([["schnitt", "Stahl im Schnitt"], ["ansicht_vorn", "Ansicht"], ["naht", "Kehlnaht"], ["schraube", "Schraube"]], 20, unten + 16, 300);
  z.h = yl + 8;
  return z;
}

function balkenLaenge(m) {
  for (const l of [20, 50, 100, 200, 250, 500, 1000]) if (l / m >= 40) return l;
  return 1000;
}
