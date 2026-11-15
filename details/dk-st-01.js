// DK-ST-01 Gelenkiger Trägeranschluss mit Fahnenblech
// Nachbau des Artefakt-Details (schematisch) als maßstäbliches, parametrisches Detail.
import { Zeichnung, massstab, waehleMassstab, fmt } from "../js/dk.js";
import {
  STAHL, STAHL_OPTIONEN, SCHRAUBEN, schraubenOptionen, FESTIGKEIT_OPTIONEN, EC3, fvRd, fbRd, fwRd, vplRd, auf5,
  reiheEinpassen, reiheMeldungen, stuetzeSichtbar,
} from "../js/stahlbau.js";

export const meta = {
  id: "DK-ST-01",
  titel: "Gelenkiger Trägeranschluss mit Fahnenblech",
  kategorie: "Stahl-Anschlüsse",
  beschreibung:
    "Träger mit dem Steg an ein Fahnenblech geschraubt (einschnittig), das Fahnenblech ist mittig an den Stützenflansch " +
    "geschweißt. Gelenkiger Querkraftanschluss. Standard: Stütze HEB 240, Träger IPE 300, Fahnenblech 10 mm, 3 × M20 8.8, S235. " +
    "Schraubenzahl, Lochabstand und Blechhöhe passen sich dem Träger an (gerader Stegteil, Blechhöhe ≥ 0,6 h), solange sie nicht " +
    "vorgegeben sind. Randabstände und Tragfähigkeit werden aus den Werten ermittelt (überschlägig nach DIN EN 1993-1-8).",
  nachweise: [
    "Schrauben: Abscheren und Lochleibung in Fahnenblech und Trägersteg",
    "Exzentrizität e (Schweißnaht bis Schraubenreihe): Gelenklage festlegen. Gelenk in der Schraubenreihe: Schweißnaht und Fahnenblech für V_{Ed} und M = V_{Ed} · e. Gelenk an der Stütze: Schraubenbild zusätzlich für V_{Ed} · e. Auf der sicheren Seite beides nachweisen",
    "Kehlnaht Fahnenblech an Stütze (V_{Ed} und V_{Ed} · e)",
    "Einseitiges Fahnenblech: Versatz e_{y} = (t_{p} + t_{w}) / 2 zwischen Blech- und Stegmitte; Träger durch Decke oder Verband gegen Verdrehen halten, sonst Zusatzmoment V_{Ed} · e_{y} berücksichtigen",
    "Fahnenblech: Biegung, Schub, Blockversagen",
    "Trägersteg: Blockversagen, Nettoquerschnitt",
  ],
  vorschau: { x0: 0, x1: 300 }, // Ausschnitt für die Kachel (px)
  faustwerte: ["Schrauben Stahlbau", "Schweißnähte"],
};

const PROFIL_I = ["IPE", "HEA", "HEB", "HEM"];
const masse = (pre, gruppe) => ["h", "b", "tw", "tf", "r"].map((k) => ({ key: `${pre}_${k}`, typ: "zahl", verborgen: true, standard: 0, gruppe }));

export const parameter = [
  { key: "stuetze", label: "Stütze", typ: "profil", reihe: PROFIL_I, standard: "HEB 240", gruppe: "Profile",
    fuellt: { h: "s_h", b: "s_b", tw: "s_tw", tf: "s_tf", r: "s_r" } },
  { key: "traeger", label: "Träger", typ: "profil", reihe: PROFIL_I, standard: "IPE 300", gruppe: "Profile",
    fuellt: { h: "t_h", b: "t_b", tw: "t_tw", tf: "t_tf", r: "t_r" } },
  ...masse("s", "Profile"), ...masse("t", "Profile"),
  { key: "schraube", label: "Schrauben", typ: "auswahl", standard: "M20", optionen: schraubenOptionen(["M12", "M16", "M20", "M24"]), gruppe: "Anschluss" },
  { key: "n", label: "Anzahl n", typ: "zahl", einheit: "", standard: 0, min: 2, max: 8, auto: true, gruppe: "Anschluss", hilfe: "leer = automatisch (Blechhöhe ≥ 0,6 h)" },
  { key: "t_p", label: "Fahnenblech t_{p}", typ: "zahl", einheit: "mm", standard: 10, min: 6, max: 30, gruppe: "Anschluss" },
  { key: "p1", label: "Lochabstand p_{1}", typ: "zahl", einheit: "mm", standard: 0, min: 30, max: 200, auto: true, gruppe: "Anschluss", weitere: true, hilfe: "leer = automatisch (3 d₀, bei wenig Steghöhe kleiner)" },
  { key: "fk", label: "Festigkeitsklasse", typ: "auswahl", standard: "8.8", optionen: FESTIGKEIT_OPTIONEN, gruppe: "Werkstoff", weitere: true },
  { key: "stahl", label: "Stahlsorte", typ: "auswahl", standard: "S235", optionen: STAHL_OPTIONEN, gruppe: "Werkstoff", weitere: true },
];

export const varianten = [
  { name: "klein", roh: { stuetze: "HEA 160", traeger: "IPE 200", schraube: "M16", n: "2", t_p: "8", p1: "60" } },
  { name: "gross", roh: { stuetze: "HEM 300", traeger: "HEB 500", schraube: "M24", n: "5", t_p: "15", p1: "80", stahl: "S355", fk: "10.9" } },
  { name: "eng", roh: { p1: "40" } },
  // Automatik: Schraubenbild folgt dem Träger
  { name: "auto_ipe160", roh: { traeger: "IPE 160" } },
  { name: "auto_ipe270", roh: { traeger: "IPE 270" } },
  { name: "auto_hea600", roh: { stuetze: "HEB 600", traeger: "HEA 600" } },
  { name: "auto_schmal", roh: { stuetze: "HEA 100", traeger: "IPE 600" } },
  { name: "zu_gross", roh: { traeger: "IPE 120", schraube: "M24" } }, // nicht lösbar: die Prüfung zeigt es
];

export function zeichne(p, opt = {}) {
  const z = new Zeichnung(940, 400, { messe: opt.messe });
  const S = { h: p.s_h, b: p.s_b, tw: p.s_tw, tf: p.s_tf, r: p.s_r };
  const T = { h: p.t_h, b: p.t_b, tw: p.t_tw, tf: p.t_tf, r: p.t_r };
  const M = p.schraube, { d, d0, dU } = SCHRAUBEN[M];
  const { t_p } = p;
  const st = STAHL[p.stahl];

  // ---------------- abgeleitete Geometrie (mm) ----------------
  const c = 10; // Spalt Trägerende – Stützenflansch
  const e2 = auf5(1.8 * d0), e2T = auf5(1.8 * d0); // Ränder Blech, Trägersteg (quer zur Kraft)
  const e = c + e2T; // Schweißnaht bis Schraubenreihe
  const l_p = e + e2; // Fahnenblechlänge
  // Schraubenbild in den geraden Stegteil des Trägers einpassen (n, p1 automatisch, wenn nicht vorgegeben)
  const lichte = T.h - 2 * (T.tf + T.r);
  const R = reiheEinpassen({ m: M, platz: lichte, ziel: 0.6 * T.h, n: p.n, p1: p.p1 });
  const { n, p1, e1, h: h_p } = R;
  if (R.nAuto) z.auto.n = n;
  if (R.pAuto) z.auto.p1 = p1;
  z.anpassungen.push(...reiheMeldungen(R, lichte, "das Fahnenblech"));
  const y_p = (T.h - h_p) / 2; // Blechoberkante ab OK Träger (mittig im Steg)
  const a = Math.max(3, Math.ceil(0.5 * t_p)); // Kehlnaht beidseitig
  const reihen = Array.from({ length: n }, (_, i) => y_p + e1 + i * p1);

  // ---------------- Prüfungen ----------------
  const TAB = `${EC3}, Tab. 3.3`;
  z.pruefe("e_{1} Fahnenblech (≥ 1,2 d_{0})", e1, 1.2 * d0, TAB);
  z.pruefe("p_{1} Lochabstand (≥ 2,2 d_{0})", p1, 2.2 * d0, TAB);
  z.pruefe("e_{2} Fahnenblech Ende (≥ 1,2 d_{0})", e2, 1.2 * d0, TAB);
  z.pruefe("e_{2} Trägersteg zum Trägerende (≥ 1,2 d_{0})", e2T, 1.2 * d0, TAB);
  z.pruefe("Fahnenblech im geraden Stegteil, frei von Flansch und Ausrundung (h_{p} ≤ h – 2(t_{f} + r))", lichte - h_p, 0, "Kollisionsprüfung");
  z.pruefe("Scheibe frei von der Kehlnaht an der Stütze (e – a√2 ≥ d_{U}/2)", e - a * Math.SQRT2, dU / 2, "Kollisionsprüfung");
  z.pruefe("Fahnenblech auf dem Stützenflansch (Nahtfläche)", S.b - (t_p + 2 * a * Math.SQRT2) - 20, 0, "konstruktiv");
  z.pruefe("Kehlnaht a ≥ 3 mm", a, 3, `${EC3}, 4.5.2`);

  // ---------------- Tragfähigkeit V_Rd (überschlägig) ----------------
  const G = "V_{Rd}";
  z.widerstand(G, `Schrauben, Abscheren (${n} × ${M} ${p.fk}, einschnittig)`, n * fvRd(M, p.fk), "kN", `${EC3}, Tab. 3.4`);
  z.widerstand(G, `Lochleibung Fahnenblech t = ${fmt(t_p)}`, n * fbRd(M, p.fk, t_p, st.fu, { e1, p1, e2 }), "kN", `${EC3}, Tab. 3.4`);
  z.widerstand(G, `Lochleibung Trägersteg t_{w} = ${fmt(T.tw)}`, n * fbRd(M, p.fk, T.tw, st.fu, { e1: 1e3, p1, e2: e2T }), "kN", `${EC3}, Tab. 3.4`);
  z.widerstand(G, "Fahnenblech, Schub (brutto)", vplRd(h_p * t_p, p.stahl), "kN", "DIN EN 1993-1-1, 6.2.6");
  z.widerstand(G, "Fahnenblech, Biegung M = V · e (elastisch)", ((t_p * h_p ** 2) / 6 * st.fy) / e / 1000, "kN", "DIN EN 1993-1-1, 6.2.5");
  const fw = fwRd(a, p.stahl); // kN/mm
  z.widerstand(G, `Kehlnähte 2 × a = ${fmt(a)}, V und V · e`, fw / Math.hypot(1 / (2 * h_p), (6 * e) / (2 * h_p ** 2)), "kN", `${EC3}, 4.5.3.3`);
  z.tragHinweise.push("Gelenk in der Schraubenreihe angenommen; mit Gelenk an der Stütze zusätzlich Schraubenbild für V · e nachweisen",
    "Blockversagen von Fahnenblech und Trägersteg sowie Versatz e_{y} nicht enthalten");
  if (h_p < 0.6 * T.h - 1e-9) z.tragHinweise.push(`Fahnenblech niedriger als 0,6 h (${fmt(h_p)} < ${fmt(Math.round(0.6 * T.h))} mm): Träger gegen Verdrehen halten (Decke, Verband)`);

  // ---------------- Ansicht, Feld x 0…300 ----------------
  z.titel(20, 26, "Ansicht");
  // Tiefe Stützen: nur der Anschlussbereich (rechter Flansch und ein Stück Steg)
  const Sv = stuetzeSichtbar(S, T);
  const L_b = Math.max(l_p + 140, 0.6 * T.h); // gezeigte Trägerlänge
  const mA = waehleMassstab(Math.max((Sv + c + L_b) / 258, (T.h + 140) / 300), [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6]);
  const yA0 = Math.max(110, 84 + 70 / mA); // OK Träger in px (Stützenkopf unter den Beschriftungen)
  const A = massstab(20 + Sv / mA, yA0, mA); // x = 0: Außenfläche Stützenflansch
  const PA = A.px;
  const yS0 = -70, yS1 = T.h + 70; // gezeigter Stützenausschnitt
  z.iAnsicht(A.X(-Sv), A.Y(yS0), PA(yS1 - yS0), S, PA, { senkrecht: true, teil: Sv });
  for (const yy of [yS0, yS1]) z.linie(A.X(-Sv) - 4, A.Y(yy), A.X(0) + 6, A.Y(yy), "mass", 1.0, "6 3");
  if (Sv < S.h) z.linie(A.X(-Sv), A.Y(yS0) - 4, A.X(-Sv), A.Y(yS1) + 4, "mass", 1.0, "6 3");
  z.iAnsicht(A.X(c), A.Y(0), PA(L_b), T, PA);
  z.linie(A.X(c + L_b), A.Y(-8), A.X(c + L_b), A.Y(T.h + 8), "mass", 1.0, "6 3");
  z.rect(A.X(0), A.Y(y_p), PA(l_p), PA(h_p), "ansicht_vorn", 1.2);
  z.rect(A.X(0), A.Y(y_p), Math.max(PA(a), 2.5), PA(h_p), "naht", 0.5);
  for (const yr of reihen) z.schraubeAnsicht(A.X(e), A.Y(yr), PA(d) / 2);
  // Schnittlinie A–A durch die oberste Schraube, an der Maßkette unterbrochen
  const yAA = reihen[0];
  const xA0 = A.X(-Sv) - 16, xA1 = A.X(c + L_b) + 16;
  const xLuecke = A.X(l_p) + 12;
  z.linie(xA0, A.Y(yAA), xLuecke - 3, A.Y(yAA), "text", 0.9, "12 3 2 3");
  z.linie(xLuecke + 30, A.Y(yAA), xA1, A.Y(yAA), "text", 0.9, "12 3 2 3");
  z.text(xA0, A.Y(yAA) - 6, "A", 15, "start", "text", true, { frei: true });
  z.text(xA1, A.Y(yAA) - 6, "A", 15, "end", "text", true, { frei: true });
  const yOben = A.Y(Math.min(0, y_p));
  z.kraft(A.X(e), yOben - 46, A.X(e), yOben - 4, "V_{Ed}", A.X(e) + 8, yOben - 24);
  z.text(20, 50, `Stütze ${p.stuetze}`, 14, "start");
  // Maße: Schraubenbild rechts am Blech (Beschriftung nur, wenn sie zwischen die Hilfslinien passt), e2 unten
  const xm = A.X(l_p) + 12;
  const seg = ["e_{1}", ...reihen.slice(1).map(() => "p_{1}"), "e_{1}"];
  z.massV([A.Y(y_p), ...reihen.map(A.Y), A.Y(y_p + h_p)], xm, seg.map((l, i) => (i === 0 || i === seg.length - 1 ? (R.passt && PA(e1) >= 20 ? l : "") : (PA(p1) >= 17 ? l : ""))),
    [[A.Y(y_p), A.X(l_p)], [A.Y(y_p + h_p), A.X(l_p)]], "rechts", { frei: true });
  const yb = A.Y(Math.max(T.h, y_p + h_p)) + 24;
  z.massH([A.X(c), A.X(e), A.X(l_p)], yb, ["e_{2,T}", "e_{2}"], [[A.X(c), A.Y(T.h) + 2], [A.X(e), A.Y(y_p + h_p) + 2], [A.X(l_p), A.Y(y_p + h_p) + 2]], { aussen: "rechts" });
  const yT1 = Math.max(yb + 30, A.Y(yS1) + 24);
  const bk = z.hinweis(A.X(0) + 1, A.Y(y_p + h_p * 0.8), `Kehlnaht a = ${fmt(a)}`, 20, yT1);
  // Trägerbezeichnung rechts in derselben Zeile, bei wenig Platz darunter
  const tt = `Träger ${p.traeger}`;
  const yTt = A.X(c + L_b) - z.messe(tt, 14) < bk.x1 + 14 ? yT1 + 20 : yT1;
  z.text(A.X(c + L_b), yTt, tt, 14, "end");
  const bA = z.massstabBalken(20, yTt + 18, mA, balkenLaenge(mA));

  // ---------------- Schnitt A–A, Feld x 370…672 ----------------
  z.titel(380, 26, "Schnitt A–A");
  const L_s = l_p + 110;
  const Sc = S.h <= 320 ? S.h : 200; // tiefe Stützen: nur das Ende mit dem Anschlussflansch
  const mS = waehleMassstab(Math.max((Sc + L_s) / 270, S.b / 220), [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4]);
  const yS = 92 + S.b / mS / 2; // Stützenachse (y) in px
  const Sx = massstab(388 + Sc / mS, yS, mS); // x = 0: Flanschaußenfläche, y = 0: Stützenachse
  const PS = Sx.px;
  if (Sc < S.h) {
    z.iProfilEnde(Sx.X(0), yS, S, PS, Sc, "schnitt");
    z.linie(Sx.X(-Sc), Sx.Y(-S.tw / 2) - 8, Sx.X(-Sc), Sx.Y(S.tw / 2) + 8, "mass", 1.0, "6 3");
  } else z.iProfil(Sx.X(-S.h / 2), yS, S, PS, "schnitt", { liegend: true });
  // Fahnenblech mittig, Trägersteg daneben
  z.rect(Sx.X(0), Sx.Y(-t_p / 2), PS(l_p), PS(t_p), "schnitt", 1.0);
  z.rect(Sx.X(c), Sx.Y(t_p / 2), PS(L_s - c), PS(T.tw), "schnitt", 1.0);
  z.linie(Sx.X(L_s), Sx.Y(t_p / 2) - 6, Sx.X(L_s), Sx.Y(t_p / 2 + T.tw) + 6, "mass", 1.0, "6 3");
  const aw = Math.max(PS(a), 4);
  for (const sg of [-1, 1]) {
    const y0 = Sx.Y(sg * t_p / 2);
    z.poly([[Sx.X(0), y0], [Sx.X(0) + aw, y0], [Sx.X(0), y0 + sg * aw]], "naht", 0.6);
  }
  // Schraube: Schaft, Kopf auf der Blechseite, Mutter auf der Stegseite
  const kd = PS(1.6 * d), kh = PS(0.65 * d);
  z.rect(Sx.X(e) - PS(d) / 2, Sx.Y(-t_p / 2) - kh, PS(d), PS(t_p + T.tw) + 2 * kh, "schraube", 0.6);
  z.rect(Sx.X(e) - kd / 2, Sx.Y(-t_p / 2) - kh, kd, kh, "schraube", 0.6);
  z.rect(Sx.X(e) - kd / 2, Sx.Y(t_p / 2 + T.tw), kd, kh, "schraube", 0.6);
  z.scherfuge(Sx.X(e) - kd, Sx.Y(t_p / 2), Sx.X(e) + kd, Sx.Y(t_p / 2));
  // Maße: Beschriftung neben der Kette, damit die Hinweislinie zum Fahnenblech frei durchläuft
  const ym = 72;
  z.massH([Sx.X(0), Sx.X(e), Sx.X(l_p)], ym, ["e", "e_{2}"], [[Sx.X(0), Sx.Y(-t_p / 2) - 2], [Sx.X(e), Sx.Y(-t_p / 2) - kh - 2], [Sx.X(l_p), Sx.Y(-t_p / 2) - 2]], { aussen: "rechts", immer: true });
  const yu = Sx.Y(S.b / 2) + 22;
  z.text(Sx.X(-Sc / 2), yu, `Stütze ${p.stuetze}`, 14, "middle");
  const xTs = Math.min(Sx.X(l_p) + 10, 670 - z.messe("Trägersteg", 14));
  const bt = z.hinweis(Sx.X(l_p + 40), Sx.Y(t_p / 2 + T.tw) + 1, "Trägersteg", xTs, yu + 22);
  z.hinweis(Sx.X(l_p * 0.6), Sx.Y(-t_p / 2) - 1, `Fahnenblech t_{p} = ${fmt(t_p)}`, 388, 48);
  const bS = z.massstabBalken(390, Math.max(yu, bt.y1) + 16, mS, balkenLaenge(mS));

  // ---------------- Text ----------------
  const Tx = 712;
  z.titel(Tx, 26, "Fahnenblechanschluss");
  const zeilen = [
    [`Stütze ${p.stuetze}`], [`Träger ${p.traeger}`], [`Fahnenblech ${fmt(l_p)} × ${fmt(h_p)} × ${fmt(t_p)}`], [`${n} × ${M} ${p.fk}, ${p.stahl}`], [`Kehlnaht a = ${fmt(a)} beidseitig`], [""],
    ["Abstände (mm):", true], [`e_{1} = ${fmt(e1)}, p_{1} = ${fmt(p1)}`], [`e_{2} = ${fmt(e2)}, e_{2,T} = ${fmt(e2T)}`], [`e = ${fmt(e)}, Spalt ${fmt(c)}`], [""],
    ["V_{Ed} wirkt in der Stegebene;"], ["Schnitt A–A: Scherfuge"], ["gestrichelt (einschnittig)."], ["Versatz Blech–Steg:"], ["e_{y} = (t_{p} + t_{w}) / 2"], [""],
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
