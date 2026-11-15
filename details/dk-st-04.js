// DK-ST-04 Laschenstoß eines Flachstahls, zweischnittig
// Nachbau des Artefakt-Details (schematisch) als maßstäbliches, parametrisches Detail.
import { Zeichnung, massstab, waehleMassstab, fmt } from "../js/dk.js";
import { STAHL, STAHL_OPTIONEN, SCHRAUBEN, schraubenOptionen, FESTIGKEIT_OPTIONEN, EC3, fvRd, fbRd, auf5, GM0, GM2 } from "../js/stahlbau.js";

export const meta = {
  id: "DK-ST-04",
  titel: "Laschenstoß eines Flachstahls, zweischnittig",
  kategorie: "Stahl-Anschlüsse",
  beschreibung:
    "Stoß eines Zugstabs aus Flachstahl mit beidseitigen Laschen, Schrauben zweischnittig. " +
    "Standard: Flachstahl 150 × 12, Laschen 2 × 8, je Stoßseite 2 × 2 M20 8.8, S235. " +
    "Randabstände in Hauptblech und Laschen und die Zugtragfähigkeit werden aus den Werten ermittelt.",
  nachweise: [
    "Schrauben: Abscheren zweischnittig, Lochleibung im Hauptblech und in den Laschen",
    "Hauptblech und Laschen: Nettoquerschnitt, Blockversagen",
    "Laschen: Summe der Laschendicken ≥ Hauptblechdicke (Faustregel)",
    "Lange Anschlüsse: Abminderung bei großer Anschlusslänge",
  ],
  vorschau: { x0: 0, x1: 672, y1: 260 }, // Ausschnitt für die Kachel (px)
  faustwerte: ["Schrauben Stahlbau"],
};

export const parameter = [
  { key: "b", label: "Breite b", typ: "zahl", einheit: "mm", standard: 150, min: 60, max: 500, gruppe: "Flachstahl" },
  { key: "t", label: "Dicke t", typ: "zahl", einheit: "mm", standard: 12, min: 5, max: 50, gruppe: "Flachstahl" },
  { key: "t_l", label: "Laschendicke t_{L}", typ: "zahl", einheit: "mm", standard: 8, min: 4, max: 30, gruppe: "Laschen" },
  { key: "schraube", label: "Schrauben", typ: "auswahl", standard: "M20", optionen: schraubenOptionen(["M12", "M16", "M20", "M24", "M27"]), gruppe: "Schrauben" },
  { key: "n1", label: "in Kraftrichtung n_{1}", typ: "zahl", einheit: "", standard: 2, min: 1, max: 6, gruppe: "Schrauben" },
  { key: "n2", label: "quer n_{2}", typ: "zahl", einheit: "", standard: 2, min: 1, max: 5, gruppe: "Schrauben" },
  { key: "p1", label: "Lochabstand p_{1}", typ: "zahl", einheit: "mm", standard: 70, min: 30, max: 200, gruppe: "Schrauben", weitere: true },
  { key: "fk", label: "Festigkeitsklasse", typ: "auswahl", standard: "8.8", optionen: FESTIGKEIT_OPTIONEN, gruppe: "Werkstoff", weitere: true },
  { key: "stahl", label: "Stahlsorte", typ: "auswahl", standard: "S235", optionen: STAHL_OPTIONEN, gruppe: "Werkstoff", weitere: true },
];

export const varianten = [
  { name: "schmal", roh: { b: "80", t: "10", t_l: "6", schraube: "M16", n1: "3", n2: "1", p1: "50" } },
  { name: "breit", roh: { b: "300", t: "25", t_l: "15", schraube: "M24", n1: "3", n2: "3", p1: "80", stahl: "S355", fk: "10.9" } },
  { name: "zu_eng", roh: { b: "100", n2: "3" } },
];

export function zeichne(p, opt = {}) {
  const z = new Zeichnung(940, 400, { messe: opt.messe, felder: [{ name: "Zeichnung", x0: 0, x1: 672 }, { name: "Text", x0: 712, x1: 940 }] });
  const { b, t, t_l, p1 } = p;
  const n1 = Math.round(p.n1), n2 = Math.round(p.n2), n = n1 * n2;
  const M = p.schraube, { d, d0 } = SCHRAUBEN[M];
  const st = STAHL[p.stahl];

  // ---------------- Geometrie (mm), x = 0: Stoßfuge, y = 0: Stabachse ----------------
  const g = 10; // Fuge zwischen den Hauptblechen
  const e1 = auf5(2 * d0);
  const e2 = n2 > 1 ? auf5(1.5 * d0) : b / 2;
  const p2 = n2 > 1 ? (b - 2 * e2) / (n2 - 1) : Infinity;
  const L_l = 2 * (2 * e1 + (n1 - 1) * p1) + g; // Laschenlänge
  const xs = Array.from({ length: n1 }, (_, i) => g / 2 + e1 + i * p1); // rechte Stoßseite
  const ys = Array.from({ length: n2 }, (_, j) => (n2 > 1 ? -b / 2 + e2 + j * p2 : 0));
  const L_show = L_l / 2 + 110;

  // ---------------- Prüfungen ----------------
  const TAB = `${EC3}, Tab. 3.3`;
  z.pruefe("e_{1} Hauptblech und Laschen (≥ 1,2 d_{0})", e1, 1.2 * d0, TAB);
  if (n1 > 1) z.pruefe("p_{1} (≥ 2,2 d_{0})", p1, 2.2 * d0, TAB);
  z.pruefe("e_{2} (≥ 1,2 d_{0})", e2, 1.2 * d0, TAB);
  if (n2 > 1) z.pruefe("p_{2} (≥ 2,4 d_{0})", p2, 2.4 * d0, TAB);
  z.pruefe("Laschen 2 t_{L} ≥ t (Faustregel)", 2 * t_l, t, "konstruktiv");

  // ---------------- Tragfähigkeit N_Rd (überschlägig) ----------------
  const G = "N_{Rd}";
  const Lj = (n1 - 1) * p1;
  const betaLf = Lj > 15 * d ? Math.max(0.75, Math.min(1, 1 - (Lj - 15 * d) / (200 * d))) : 1;
  z.widerstand(G, `Schrauben, Abscheren zweischnittig (${n} × ${M} ${p.fk}${betaLf < 1 ? `, β_{Lf} = ${fmt(Math.round(betaLf * 100) / 100)}` : ""})`, betaLf * n * 2 * fvRd(M, p.fk), "kN", `${EC3}, Tab. 3.4, 3.8`);
  const lage = { e1, p1: n1 > 1 ? p1 : Infinity, e2, p2 };
  z.widerstand(G, `Lochleibung Hauptblech t = ${fmt(t)}`, n * fbRd(M, p.fk, t, st.fu, lage), "kN", `${EC3}, Tab. 3.4`);
  z.widerstand(G, `Lochleibung Laschen 2 × t_{L} = ${fmt(t_l)}`, 2 * n * fbRd(M, p.fk, t_l, st.fu, lage), "kN", `${EC3}, Tab. 3.4`);
  z.widerstand(G, "Hauptblech, Bruttoquerschnitt N_{pl,Rd}", (b * t * st.fy) / GM0 / 1000, "kN", "DIN EN 1993-1-1, 6.2.3");
  z.widerstand(G, "Hauptblech, Nettoquerschnitt N_{u,Rd}", (0.9 * (b - n2 * d0) * t * st.fu) / GM2 / 1000, "kN", "DIN EN 1993-1-1, 6.2.3");
  z.widerstand(G, "Laschen, Nettoquerschnitt N_{u,Rd}", (0.9 * (b - n2 * d0) * 2 * t_l * st.fu) / GM2 / 1000, "kN", "DIN EN 1993-1-1, 6.2.3");
  z.tragHinweise.push("Blockversagen (Gruppe am Blechende) nicht enthalten", "Gleiche Breite von Laschen und Hauptblech angenommen");

  // ---------------- Draufsicht ----------------
  z.titel(20, 26, "Draufsicht");
  const m = waehleMassstab(Math.max((2 * L_show) / 520, b / 140), [0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5]);
  const yD = 70 + b / m / 2;
  const D = massstab(346, yD, m), P = D.px;
  for (const sg of [-1, 1]) {
    const [x0, x1] = sg < 0 ? [-L_show, -g / 2] : [g / 2, L_show];
    z.rect(D.X(x0), D.Y(-b / 2), P(x1 - x0), P(b), "ansicht_hinten", 1.2);
  }
  z.rect(D.X(-L_l / 2), D.Y(-b / 2), P(L_l), P(b), "ansicht_vorn", 1.2);
  for (const x of [-g / 2, g / 2]) z.linie(D.X(x), D.Y(-b / 2), D.X(x), D.Y(b / 2), "mass", 0.9, "4 3");
  for (const sg of [-1, 1]) for (const x of xs) for (const y of ys) z.schraubeAnsicht(D.X(sg * x), D.Y(y), P(d) / 2);
  for (const x of [-L_show, L_show]) z.linie(D.X(x), D.Y(-b / 2) - 6, D.X(x), D.Y(b / 2) + 6, "mass", 1.0, "6 3");
  // Kräfte
  z.kraft(D.X(-L_show) - 4, yD, D.X(-L_show) - 44, yD, "N_{Ed}", D.X(-L_show) - 46, yD - 10, "start");
  z.kraft(D.X(L_show) + 4, yD, D.X(L_show) + 44, yD, "N_{Ed}", D.X(L_show) + 46, yD - 10, "end");
  // Maße unten: e1, p1, e1 je Seite
  const yb = D.Y(b / 2) + 22;
  const kette = (sg) => {
    const pts = [sg * L_l / 2, ...xs.slice().reverse().map((x) => sg * x).reverse(), sg * g / 2];
    const sortiert = [...new Set(pts)].sort((u, v) => u - v);
    const labels = sortiert.slice(1).map((_, i) => {
      const lang = sortiert[i + 1] - sortiert[i];
      return Math.abs(lang - e1) < 1e-6 ? "e_{1}" : "p_{1}";
    });
    z.massH(sortiert.map(D.X), yb, labels, sortiert.map((x) => [D.X(x), D.Y(b / 2) + 2]));
  };
  kette(-1); kette(1);
  // Maße links: e2, p2, e2
  const xm = D.X(-L_l / 2) - 14;
  const yk = [-b / 2, ...ys, b / 2];
  z.massV(yk.map(D.Y), xm, yk.slice(1).map((y, i) => (P(y - yk[i]) >= 15 ? (i === 0 || i === yk.length - 2 ? "e_{2}" : "p_{2}") : "")),
    yk.map((y) => [D.Y(y), D.X(-L_l / 2)]), "links");
  z.text(D.X(-L_show) + 8, D.Y(-b / 2) - 8, `Hauptblech ${fmt(b)} × ${fmt(t)}`, 14);
  z.text(D.X(L_l / 2), D.Y(-b / 2) - 8, `Laschen 2 × ${fmt(t_l)}`, 14, "end");

  // ---------------- Schnitt ----------------
  const yS0 = yb + 54;
  z.titel(20, yS0, "Schnitt");
  const yA = yS0 + 34 + (t / 2 + t_l + 0.8 * d) / m;
  const S = massstab(346, yA, m);
  for (const sg of [-1, 1]) {
    const [x0, x1] = sg < 0 ? [-L_show, -g / 2] : [g / 2, L_show];
    z.rect(S.X(x0), S.Y(-t / 2), P(x1 - x0), Math.max(P(t), 2), "schnitt", 1.0);
  }
  for (const sg of [-1, 1]) z.rect(S.X(-L_l / 2), sg < 0 ? S.Y(-t / 2 - t_l) : S.Y(t / 2), P(L_l), Math.max(P(t_l), 2), "schnitt", 1.0);
  const kopf = 0.65 * d;
  for (const sg of [-1, 1]) for (const x of xs)
    z.schraubeSeite({ achseX: S.X(sg * x), von: S.Y(-t / 2 - t_l), bis: S.Y(t / 2 + t_l), d: P(d), kopf: [P(kopf), P(1.6 * d)], mutter: [P(0.8 * d), P(1.6 * d)] });
  for (const x of [-L_show, L_show]) z.linie(S.X(x), S.Y(-t / 2) - 6, S.X(x), S.Y(t / 2) + 6, "mass", 1.0, "6 3");
  z.kraft(S.X(-L_show) - 4, yA, S.X(-L_show) - 44, yA, "N_{Ed}", S.X(-L_show) - 46, yA - 10, "start");
  z.kraft(S.X(L_show) + 4, yA, S.X(L_show) + 44, yA, "N_{Ed}", S.X(L_show) + 46, yA - 10, "end");
  const yt = S.Y(t / 2 + t_l + 0.8 * d) + 22;
  z.text(S.X(L_show), yt, "2 Scherfugen je Schraube", 14, "end");
  const bm = z.massstabBalken(20, yt + 10, m, balkenLaenge(m));

  // ---------------- Text ----------------
  const Tx = 712;
  z.titel(Tx, 26, "Laschenstoß");
  const zeilen = [
    [`Flachstahl ${fmt(b)} × ${fmt(t)}, ${p.stahl}`], [`Laschen 2 × ${fmt(b)} × ${fmt(t_l)}, l = ${fmt(L_l)}`], [`je Seite ${n1} × ${n2} ${M} ${p.fk}`], [""],
    ["Abstände (mm):", true], [`e_{1} = ${fmt(e1)}${n1 > 1 ? `, p_{1} = ${fmt(p1)}` : ""}`], [`e_{2} = ${fmt(Math.round(e2 * 10) / 10)}${n2 > 1 ? `, p_{2} = ${fmt(Math.round(p2 * 10) / 10)}` : ""}`], [`Fuge ${fmt(g)}`], [""],
    [`Maßstab 1 px = ${fmt(m)} mm`, false, "mass"],
  ];
  let y = 50;
  for (const [tx, f, art] of zeilen) { if (tx) { z.text(Tx, y, tx, 14, "start", art || "text", !!f); y += 20; } else y += 8; }
  const unten = Math.max(bm.y1, y - 16);
  const yl = z.legende([["schnitt", "Stahl im Schnitt"], ["ansicht_hinten", "Hauptblech"], ["ansicht_vorn", "Lasche"], ["schraube", "Schraube"]], 20, unten + 16, 672);
  z.h = yl + 8;
  return z;
}

function balkenLaenge(m) {
  for (const l of [20, 50, 100, 200, 250, 500, 1000]) if (l / m >= 40) return l;
  return 1000;
}
