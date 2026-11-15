// DK-ST-02 Gelenkiger Trägeranschluss mit kurzer Stirnplatte
// Nachbau des Artefakt-Details (schematisch) als maßstäbliches, parametrisches Detail.
import { Zeichnung, massstab, waehleMassstab, fmt } from "../js/dk.js";
import {
  STAHL, STAHL_OPTIONEN, SCHRAUBEN, schraubenOptionen, FESTIGKEIT_OPTIONEN, EC3, fvRd, fbRd, fwRd, vplRd, auf5,
  PROFIL_I, profilMasse, profilFuellt, profilAus,
} from "../js/stahlbau.js";

export const meta = {
  id: "DK-ST-02",
  titel: "Gelenkiger Trägeranschluss mit kurzer Stirnplatte",
  kategorie: "Stahl-Anschlüsse",
  beschreibung:
    "Kurze Stirnplatte an den Trägersteg geschweißt, mit dem Stützenflansch verschraubt (zwei Schraubenreihen). " +
    "Querkraftanschluss, gelenkig durch dünne Stirnplatte. Standard: Stütze HEB 240, Träger IPE 300, Stirnplatte 10 mm, " +
    "2 × 3 M20 8.8, S235. Randabstände in Stirnplatte und Stützenflansch und Tragfähigkeit werden aus den Werten ermittelt.",
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
  { key: "n", label: "Reihen n (je 2 Schrauben)", typ: "zahl", einheit: "", standard: 3, min: 2, max: 8, gruppe: "Anschluss" },
  { key: "t_p", label: "Stirnplatte t_{p}", typ: "zahl", einheit: "mm", standard: 10, min: 8, max: 25, gruppe: "Anschluss" },
  { key: "p1", label: "Lochabstand p_{1}", typ: "zahl", einheit: "mm", standard: 70, min: 30, max: 200, gruppe: "Anschluss", weitere: true },
  { key: "w", label: "Wurzelmaß w", typ: "zahl", einheit: "mm", standard: 0, min: 0, max: 300, gruppe: "Anschluss", weitere: true, hilfe: "0 = automatisch" },
  { key: "fk", label: "Festigkeitsklasse", typ: "auswahl", standard: "8.8", optionen: FESTIGKEIT_OPTIONEN, gruppe: "Werkstoff", weitere: true },
  { key: "stahl", label: "Stahlsorte", typ: "auswahl", standard: "S235", optionen: STAHL_OPTIONEN, gruppe: "Werkstoff", weitere: true },
];

export const varianten = [
  { name: "klein", roh: { stuetze: "HEA 140", traeger: "IPE 200", schraube: "M16", n: "2", p1: "60", t_p: "8" } },
  { name: "gross", roh: { stuetze: "HEB 400", traeger: "IPE 500", schraube: "M24", n: "5", p1: "75", t_p: "15", stahl: "S355" } },
  { name: "eng", roh: { p1: "40", w: "50" } },
];

export function zeichne(p, opt = {}) {
  const z = new Zeichnung(940, 400, { messe: opt.messe });
  const S = profilAus(p, "s"), T = profilAus(p, "t");
  const M = p.schraube, { d, d0 } = SCHRAUBEN[M];
  const n = Math.round(p.n), { t_p, p1 } = p;
  const st = STAHL[p.stahl];

  // ---------------- abgeleitete Geometrie (mm) ----------------
  const a = Math.max(3, Math.ceil(0.5 * T.tw)); // Kehlnähte Steg – Stirnplatte, beidseitig
  const w = p.w > 0 ? p.w : Math.max(auf5(T.tw + 2 * a * Math.SQRT2 + 2 * (d + 10)), auf5(2.4 * d0));
  const e2 = auf5(1.5 * d0), b_p = w + 2 * e2;
  const e1 = auf5(1.8 * d0), h_p = (n - 1) * p1 + 2 * e1;
  const lichte = T.h - 2 * (T.tf + T.r);
  const y_p = T.tf + T.r + Math.max(0, (lichte - h_p) / 2); // Plattenoberkante ab OK Träger
  const e2c = (S.b - w) / 2; // Randabstand im Stützenflansch
  const reihen = Array.from({ length: n }, (_, i) => y_p + e1 + i * p1);

  // ---------------- Prüfungen ----------------
  const TAB = `${EC3}, Tab. 3.3`;
  z.pruefe("e_{1} Stirnplatte (≥ 1,2 d_{0})", e1, 1.2 * d0, TAB);
  z.pruefe("p_{1} Lochabstand (≥ 2,2 d_{0})", p1, 2.2 * d0, TAB);
  z.pruefe("e_{2} Stirnplatte (≥ 1,2 d_{0})", e2, 1.2 * d0, TAB);
  z.pruefe("e_{2,c} Stützenflansch (≥ 1,2 d_{0})", e2c, 1.2 * d0, TAB);
  z.pruefe("p_{2} = w (≥ 2,4 d_{0})", w, 2.4 * d0, TAB);
  z.pruefe("Schraube neben der Naht (w/2 – t_{w}/2 – a√2 ≥ d)", w / 2 - T.tw / 2 - a * Math.SQRT2, d, "konstruktiv (Schlüsselweite)");
  z.pruefe("Stirnplatte im geraden Stegteil (h_{p} ≤ h – 2(t_{f} + r))", lichte - h_p, 0, "geometrisch");
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

  // ---------------- Ansicht, Feld x 0…300 ----------------
  z.titel(20, 26, "Ansicht");
  const L_b = Math.max(160, 0.7 * T.h);
  const kopf = 0.65 * d;
  const mA = waehleMassstab(Math.max((S.h + t_p + L_b) / 262, (T.h + 140) / 300), [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6]);
  const yA0 = Math.max(108, 82 + 70 / mA);
  const A = massstab(20 + S.h / mA, yA0, mA), PA = A.px; // x = 0: Außenfläche Stützenflansch
  const yS0 = -70, yS1 = T.h + 70;
  z.iAnsicht(A.X(-S.h), A.Y(yS0), PA(yS1 - yS0), S, PA, { senkrecht: true });
  for (const yy of [yS0, yS1]) z.linie(A.X(-S.h) - 6, A.Y(yy), A.X(0) + 6, A.Y(yy), "mass", 1.0, "6 3");
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
  z.kraft(A.X(t_p + L_b * 0.6), A.Y(0) - 52, A.X(t_p + L_b * 0.6), A.Y(0) - 4, "V_{Ed}", A.X(t_p + L_b * 0.6) + 8, A.Y(0) - 32);
  z.text(20, A.Y(yS0) - 26, "Stütze", 14);
  z.text(20, A.Y(yS0) - 8, p.stuetze, 14);
  const yT1 = A.Y(yS1) + 24;
  const bp = z.hinweis(A.X(t_p / 2), A.Y(y_p + h_p) + 1, `Stirnplatte t_{p} = ${fmt(t_p)}`, 20, yT1);
  z.text(A.X(t_p + L_b), yT1 + 24, `Träger ${p.traeger}`, 14, "end");
  const bA = z.massstabBalken(20, yT1 + 42, mA, balkenLaenge(mA));

  // ---------------- Schnitt B–B, Feld x 370…672 ----------------
  z.titel(380, 26, "Schnitt B–B");
  const hS = Math.max(T.h, h_p) + 60;
  const mS = waehleMassstab(Math.max(S.b / 190, hS / 250), [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4]);
  const xc = 400 + 26 + S.b / mS / 2; // Trägerachse in px
  const B = massstab(xc, 96, mS), PB = B.px; // y = 0: OK Träger
  z.rect(B.X(-S.b / 2), B.Y(-30), PB(S.b), PB(T.h + 60), "ansicht_hinten", 1.0); // Stützenflansch dahinter
  for (const yy of [-30, T.h + 30]) z.linie(B.X(-S.b / 2) - 6, B.Y(yy), B.X(S.b / 2) + 6, B.Y(yy), "mass", 1.0, "6 3");
  z.rect(B.X(-b_p / 2), B.Y(y_p), PB(b_p), PB(h_p), "ansicht_vorn", 1.2);
  z.iProfil(xc, B.Y(T.h / 2), T, PB, "schnitt");
  const aw = Math.max(PB(a), 2);
  for (const sg of [-1, 1]) z.rect(sg < 0 ? B.X(-T.tw / 2) - aw : B.X(T.tw / 2), B.Y(y_p), aw, PB(h_p), "naht", 0.4);
  for (const yr of reihen) for (const sg of [-1, 1]) z.schraubeAnsicht(B.X(sg * w / 2), B.Y(yr), PB(d) / 2);
  // Maße: unten Platte und Stützenflansch, rechts Schraubenbild
  const yb1 = B.Y(T.h + 30) + 20, yb2 = yb1 + 26;
  z.massH([B.X(-b_p / 2), B.X(-w / 2), B.X(w / 2), B.X(b_p / 2)], yb1, ["e_{2}", "w", "e_{2}"],
    [[B.X(-b_p / 2), B.Y(y_p + h_p) + 2], [B.X(-w / 2), B.Y(reihen[n - 1]) + PB(d) / 2 + 3], [B.X(w / 2), B.Y(reihen[n - 1]) + PB(d) / 2 + 3], [B.X(b_p / 2), B.Y(y_p + h_p) + 2]]);
  z.massH([B.X(-S.b / 2), B.X(-w / 2), B.X(w / 2), B.X(S.b / 2)], yb2, [["e_{2,c}", ""], "w", ["e_{2,c}", ""]],
    [[B.X(-S.b / 2), B.Y(T.h + 30) + 2], [B.X(S.b / 2), B.Y(T.h + 30) + 2]]);
  const xm = B.X(S.b / 2) + 14;
  z.massV([B.Y(y_p), ...reihen.map(B.Y), B.Y(y_p + h_p)], xm, ["e_{1}", ...reihen.slice(1).map(() => "p_{1}"), "e_{1}"].map((l, i, arr) => (PB(i === 0 || i === arr.length - 1 ? e1 : p1) >= 15 ? l : "")),
    [[B.Y(y_p), B.X(b_p / 2)], [B.Y(y_p + h_p), B.X(b_p / 2)]]);
  const bS = z.massstabBalken(390, yb2 + 22, mS, balkenLaenge(mS));

  // ---------------- Text ----------------
  const Tx = 712;
  z.titel(Tx, 26, "Kurze Stirnplatte");
  const zeilen = [
    [`Stütze ${p.stuetze}, Träger ${p.traeger}`], [`Stirnplatte ${fmt(b_p)} × ${fmt(h_p)} × ${fmt(t_p)}`], [`2 × ${n} ${M} ${p.fk}, ${p.stahl}`], [`Kehlnähte a = ${fmt(a)} am Steg`], [""],
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
