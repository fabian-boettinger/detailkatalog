// DK-ST-03 Biegesteifer Stirnplattenstoß, überstehend
// Nachbau des Artefakt-Details (schematisch) als maßstäbliches, parametrisches Detail mit
// überschlägiger Momententragfähigkeit (vereinfachtes Komponentenmodell DIN EN 1993-1-8, 6.2.7).
import { Zeichnung, massstab, waehleMassstab, fmt } from "../js/dk.js";
import {
  STAHL, STAHL_OPTIONEN, SCHRAUBEN, schraubenOptionen, FESTIGKEIT_OPTIONEN, EC3, fvRd, fbRd, ftRd, auf5,
  PROFIL_I, profilMasse, profilFuellt, profilAus, wpl, tStummel, E_STAHL,
  wurzelmass, wurzelMeldungen, plattenRand, stuetzeSichtbar,
} from "../js/stahlbau.js";

export const meta = {
  id: "DK-ST-03",
  titel: "Biegesteifer Stirnplattenstoß, überstehend",
  kategorie: "Stahl-Anschlüsse",
  beschreibung:
    "Überstehende Stirnplatte am Träger, mit dem Stützenflansch verschraubt (Zugzone oben, je Reihe zwei Schrauben). " +
    "Überträgt M, V und N. Standard: Stütze HEB 300, Träger IPE 360, Stirnplatte 20 mm, 3 Reihen M20 10.9, S235. " +
    "Wurzelmaß, Plattenbreite und Lage der Reihen passen sich Träger und Stütze an (Scheiben frei neben Steg, Naht und " +
    "Ausrundung, Randabstand im Stützenflansch); bei niedrigen Trägern entfällt die dritte Reihe. " +
    "Momententragfähigkeit überschlägig mit vereinfachtem Komponentenmodell.",
  nachweise: [
    "Zugzone: T-Stummel (Stirnplatte und Stützenflansch), Schrauben auf Zug inkl. Abstützkräfte",
    "Druckzone: Stützensteg unter Querdruck, ggf. Steifen",
    "Stützensteg auf Schub (Schubfeld)",
    "Schrauben der Schubreihe: Abscheren und Lochleibung",
    "Kehlnähte Flansch und Steg an Stirnplatte",
    "Anschlusssteifigkeit für die Schnittgrößenermittlung einordnen",
  ],
  vorschau: { x0: 0, x1: 300 }, // Ausschnitt für die Kachel (px)
  faustwerte: ["Schrauben Stahlbau", "Schweißnähte", "Stirn- und Fußplatten"],
};

export const parameter = [
  { key: "stuetze", label: "Stütze", typ: "profil", reihe: PROFIL_I, standard: "HEB 300", gruppe: "Profile", fuellt: profilFuellt("s") },
  { key: "traeger", label: "Träger", typ: "profil", reihe: PROFIL_I, standard: "IPE 360", gruppe: "Profile", fuellt: profilFuellt("t") },
  ...profilMasse("s", "Profile"), ...profilMasse("t", "Profile"),
  { key: "schraube", label: "Schrauben", typ: "auswahl", standard: "M20", optionen: schraubenOptionen(["M16", "M20", "M24", "M27", "M30"]), gruppe: "Anschluss" },
  { key: "t_p", label: "Stirnplatte t_{p}", typ: "zahl", einheit: "mm", standard: 20, min: 10, max: 50, gruppe: "Anschluss" },
  { key: "steifen", label: "Steifen in der Stütze", typ: "auswahl", standard: "nein", gruppe: "Anschluss",
    optionen: [{ wert: "nein", text: "ohne Steifen" }, { wert: "ja", text: "Steifen in Höhe der Trägerflansche" }] },
  { key: "w", label: "Wurzelmaß w", typ: "zahl", einheit: "mm", standard: 0, min: 40, max: 300, auto: true, gruppe: "Anschluss", weitere: true, hilfe: "leer = automatisch (aus Steg, Naht, Ausrundung der Stütze)" },
  { key: "fk", label: "Festigkeitsklasse", typ: "auswahl", standard: "10.9", optionen: FESTIGKEIT_OPTIONEN, gruppe: "Werkstoff", weitere: true },
  { key: "stahl", label: "Stahlsorte", typ: "auswahl", standard: "S235", optionen: STAHL_OPTIONEN, gruppe: "Werkstoff", weitere: true },
];

export const varianten = [
  { name: "klein", roh: { stuetze: "HEB 200", traeger: "IPE 240", schraube: "M16", t_p: "15", fk: "8.8" } },
  { name: "gross", roh: { stuetze: "HEM 400", traeger: "HEB 600", schraube: "M27", t_p: "30", steifen: "ja", stahl: "S355" } },
  { name: "steifen", roh: { steifen: "ja" } },
  // Automatik: Lage der Reihen folgt dem Träger, Wurzelmaß der Stütze
  { name: "auto_niedrig", roh: { stuetze: "HEB 200", traeger: "IPE 120" } }, // dritte Reihe entfällt
  { name: "auto_tief", roh: { stuetze: "HEB 600", traeger: "HEA 500" } },
  { name: "zu_breit", roh: { stuetze: "HEA 200", traeger: "HEB 300" } }, // Träger breiter als die Stütze: die Prüfung zeigt es
];

export function zeichne(p, opt = {}) {
  const z = new Zeichnung(940, 440, { messe: opt.messe });
  const S = profilAus(p, "s"), T = profilAus(p, "t");
  const M = p.schraube, { d, d0, dU } = SCHRAUBEN[M];
  const { t_p } = p, st = STAHL[p.stahl], steifen = p.steifen === "ja";

  // ---------------- abgeleitete Geometrie (mm), y = 0: OK Träger, x = 0: Außenfläche Stützenflansch ----------------
  const a_f = Math.max(4, Math.ceil(0.55 * T.tf)), a_w = Math.max(3, Math.ceil(0.5 * T.tw)); // Kehlnähte Flansch / Steg
  // Wurzelmaß: Scheiben frei neben Trägersteg + Naht und neben Stützensteg + Ausrundung, Rand im Stützenflansch
  const W = wurzelmass({ m: M, w: p.w, twT: T.tw, nahtT: a_w, S, bMax: S.b });
  const w = W.w;
  if (W.auto) z.auto.w = w;
  z.anpassungen.push(...wurzelMeldungen(W, M));
  const e2 = plattenRand(M, w, S.b), b_p = Math.max(T.b, w + 2 * e2), e2p = (b_p - w) / 2;
  if (e2 < auf5(1.5 * d0) && b_p <= S.b && b_p > T.b) z.anpassungen.push(`Randabstand e_{2} der Stirnplatte auf ${fmt(e2)} mm verkleinert, damit die Platte nicht über den Stützenflansch (b = ${fmt(S.b)} mm) steht.`);
  if (T.b > S.b) z.anpassungen.push(`Nicht lösbar: Trägerflansch (b = ${fmt(T.b)} mm) breiter als der Stützenflansch (b = ${fmt(S.b)} mm). Breitere Stütze oder schmaleren Träger wählen.`);
  // Schraubenachse – Flanschfläche u und Zahl der Reihen: Reihe 2 und 3 brauchen zwischen den Flanschen
  // den Lochabstand 2,2 d0; reicht die Höhe nicht, wird u bis d + a√2 verkleinert, dann entfällt Reihe 3
  const uStd = auf5(1.2 * d + a_f * Math.SQRT2), uMin = auf5(d + a_f * Math.SQRT2);
  const innen = T.h - 2 * T.tf;
  let u = uStd, drei = true;
  if (innen - 2 * uStd < 2.2 * d0) {
    if (innen - 2 * uMin >= 2.2 * d0) u = uMin;
    else { drei = false; u = innen - 2 * uStd >= 0 ? uStd : uMin; }
  }
  const passtReihe2 = innen - 2 * u >= -0.05; // Reihe 2 frei von der Naht am Druckflansch
  if (!passtReihe2) z.anpassungen.push(`Nicht lösbar: Schraubenreihe passt nicht zwischen die Trägerflansche (${fmt(Math.round(innen * 10) / 10)} mm, nötig 2 u = ${fmt(2 * u)} mm). Kleinere Schraube oder höheren Träger wählen.`);
  else if (!drei) z.anpassungen.push(`Träger zu niedrig für drei Schraubenreihen mit ${M}: Reihe 3 entfällt, die Querkraft übernehmen die Zugreihen (0,4/1,4).`);
  else if (u < uStd) z.anpassungen.push(`Abstand u (Schraubenachse – Flansch) von ${fmt(uStd)} auf ${fmt(u)} mm verkleinert, damit Reihe 2 und 3 den Lochabstand 2,2 d_{0} einhalten.`);
  const ex = auf5(1.5 * d0);
  const y_top = -(u + ex), y_bot = T.h + auf5(a_f * Math.SQRT2 + 10);
  const reihen = drei ? [-u, T.tf + u, T.h - T.tf - u] : [-u, T.tf + u];
  const nR = reihen.length;
  const e1u = y_bot - reihen[nR - 1];
  const e2c = (S.b - w) / 2;

  // ---------------- Prüfungen ----------------
  const TAB = `${EC3}, Tab. 3.3`;
  z.pruefe("e_{x} Plattenüberstand (≥ 1,2 d_{0})", ex, 1.2 * d0, TAB);
  z.pruefe("e_{1} unten (≥ 1,2 d_{0})", e1u, 1.2 * d0, TAB);
  if (drei) z.pruefe("p_{2} Reihe 2 – Reihe 3 (≥ 2,2 d_{0})", reihen[2] - reihen[1], 2.2 * d0, TAB);
  z.pruefe("e_{2} Stirnplatte (≥ 1,2 d_{0})", e2p, 1.2 * d0, TAB);
  z.pruefe("e_{2,c} Stützenflansch (≥ 1,2 d_{0})", e2c, 1.2 * d0, TAB);
  z.pruefe("w (≥ 2,4 d_{0})", w, 2.4 * d0, TAB);
  z.pruefe("Schraube – Nahtfuß Flansch (u – a√2 ≥ d)", u - a_f * Math.SQRT2, d, "Kollisionsprüfung (Schlüsselweite)");
  z.pruefe(`Reihe ${drei ? "2 und 3" : "2"} zwischen den Trägerflanschen (h – 2 t_{f} – 2 u ≥ 0)`, innen - 2 * u, 0, "Kollisionsprüfung");
  z.pruefe("Schraube neben der Naht am Trägersteg (w/2 – t_{w}/2 – a√2 ≥ d)", w / 2 - T.tw / 2 - a_w * Math.SQRT2, d, "Kollisionsprüfung (Schlüsselweite)");
  z.pruefe("Scheibe frei von Steg und Ausrundung der Stütze (w/2 – t_{w,c}/2 – r_{c} ≥ d_{U}/2)", w / 2 - S.tw / 2 - S.r, dU / 2, "Kollisionsprüfung");
  z.pruefe("Stirnplatte nicht breiter als der Stützenflansch", S.b - b_p, 0, "geometrisch");

  // ---------------- Tragfähigkeit (überschlägig) ----------------
  const fy = st.fy, ft2 = 2 * ftRd(M, p.fk);
  const ALPHA = 5.5; // Beiwert α für die Reihe neben dem Flansch bzw. der Steife (Bild 6.11), vereinfacht
  // Stirnplatte, Reihe 1 (Überstand) und Reihe 2 (unter dem Flansch)
  const mx = u - 0.8 * a_f * Math.SQRT2;
  const leff1 = Math.min(4 * mx + 1.25 * ex, e2p + 2 * mx + 0.625 * ex, 0.5 * b_p, 0.5 * w + 2 * mx + 0.625 * ex, 2 * Math.PI * mx, Math.PI * mx + w, Math.PI * mx + 2 * e2p);
  const m2 = (w - T.tw) / 2 - 0.8 * a_w * Math.SQRT2;
  const leff2 = Math.min(2 * Math.PI * m2, ALPHA * m2);
  // Stützenflansch
  const mc = (w - S.tw) / 2 - 0.8 * S.r;
  // Steifen erhöhen hier vereinfacht nur die Druckseite; Zugseite wie ohne Steifen (auf der sicheren Seite)
  const leffc = Math.min(2 * Math.PI * mc, 4 * mc + 1.25 * e2c);
  const zeile = (r, leffP, mP, eP) => {
    const G = `F_{t${r},Rd}`;
    z.widerstand(G, `Reihe ${r}: Schrauben auf Zug (2 × ${M} ${p.fk})`, ft2, "kN", `${EC3}, Tab. 3.4`);
    z.widerstand(G, `Reihe ${r}: Stirnplatte (T-Stummel, l_{eff} = ${fmt(Math.round(leffP))})`, tStummel(leffP, t_p, mP, eP, fy, ft2), "kN", `${EC3}, 6.2.6.5`);
    z.widerstand(G, `Reihe ${r}: Stützenflansch (T-Stummel, l_{eff} = ${fmt(Math.round(leffc))})`, tStummel(leffc, S.tf, mc, e2c, fy, ft2), "kN", `${EC3}, 6.2.6.4`);
    z.widerstand(G, `Reihe ${r}: Stützensteg auf Zug (ω = 1)`, (leffc * S.tw * fy) / 1000, "kN", `${EC3}, 6.2.6.3`);
  };
  zeile(1, leff1, mx, ex);
  zeile(2, leff2, m2, e2p);
  // Druck und Schub
  const Gc = "F_{c,Rd}";
  z.widerstand(Gc, "Trägerflansch und -steg auf Druck M_{c,Rd} / (h – t_{f})", (wpl(T) * fy) / (T.h - T.tf) / 1000, "kN", `${EC3}, 6.2.6.7`);
  const beffc = T.tf + 2 * Math.SQRT2 * a_f + 5 * (S.tf + S.r) + 2 * t_p;
  const dwc = S.h - 2 * (S.tf + S.r);
  const lam = 0.932 * Math.sqrt((beffc * dwc * fy) / (E_STAHL * S.tw ** 2));
  const rho = lam <= 0.72 ? 1 : (lam - 0.2) / lam ** 2;
  const steifeA = steifen ? (S.b - S.tw) * T.tf : 0; // Steifen beidseitig, Dicke = Trägerflansch
  z.widerstand(Gc, steifen ? "Stützensteg auf Querdruck + Steifen" : "Stützensteg auf Querdruck (ω = 1, k_{wc} = 1)", ((rho * beffc * S.tw + steifeA) * fy) / 1000, "kN", `${EC3}, 6.2.6.2`);
  const Avc = S.A - 2 * S.b * S.tf + (S.tw + 2 * S.r) * S.tf;
  z.widerstand(Gc, "Stützensteg auf Schub (Schubfeld, β = 1)", (0.9 * fy * Avc) / Math.sqrt(3) / 1000, "kN", `${EC3}, 6.2.6.1`);
  // Moment: Zugreihen bis zur Druck-/Schubgrenze, Reihe 2 zuerst abmindern
  const min = (g) => Math.min(...z.widerstaende.filter((x) => x.gruppe === g).map((x) => x.wert));
  let F1 = min("F_{t1,Rd}"), F2 = min("F_{t2,Rd}");
  const Fc = min(Gc);
  if (F1 + F2 > Fc) { F2 = Math.max(0, Fc - F1); F1 = Math.min(F1, Fc); }
  const yc = T.h - T.tf / 2;
  const Mj = (F1 * (yc - reihen[0]) + F2 * (yc - reihen[1])) / 1000;
  z.widerstand("M_{j,Rd}", "Zugreihen 1 + 2 mit Hebelarm zur Druckflanschmitte", Mj, "kNm", `${EC3}, 6.2.7.2`);
  const Mpl = (wpl(T) * fy) / 1e6;
  // Querkraft: Reihe 3 voll, Zugreihen mit 0,4/1,4 (Tab. 3.4, Anm.)
  const fv = fvRd(M, p.fk);
  const fb = Math.min(fbRd(M, p.fk, t_p, st.fu, { e1: e1u, e2: e2p, p2: w }), fbRd(M, p.fk, S.tf, st.fu, { e1: 1e3, e2: e2c, p2: w }));
  z.widerstand("V_{Rd}", drei ? "Schrauben Reihe 3 voll, Reihen 1–2 mit 0,4/1,4 (Abscheren/Lochleibung)" : "Schrauben Reihen 1–2 mit 0,4/1,4 (Abscheren/Lochleibung), ohne Reihe 3",
    ((drei ? 2 : 0) + 4 * 0.4 / 1.4) * Math.min(fv, fb), "kN", `${EC3}, Tab. 3.4`);
  z.tragHinweise.push(
    `Träger: M_{pl,Rd} ≈ ${fmt(Math.round(Mpl))} kNm; Anschluss ${Mj >= Mpl ? "volltragfähig" : "teiltragfähig"} (M_{j,Rd} ${Mj >= Mpl ? "≥" : "<"} M_{pl,Rd})`,
    "Vereinfachungen: Einzelreihen ohne Gruppenwirkung, α = 5,5 für Reihen neben Flansch/Steife, ω = 1, Nähte volltragfähig",
    "N_{Ed} klein angenommen (≤ 5 % N_{pl,Rd}), sonst Interaktion M–N",
  );

  // ---------------- Ansicht, Feld x 0…300 ----------------
  z.titel(20, 26, "Ansicht");
  const kopf = 0.65 * d;
  const Sv = stuetzeSichtbar(S, T); // tiefe Stützen: nur der Anschlussbereich
  const L_b = Math.max(260, 0.6 * T.h);
  const yS0 = y_top - 60, yS1 = y_bot + 60;
  const mA = waehleMassstab(Math.max((Sv + t_p + L_b) / 258, (yS1 - yS0) / 330), [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8]);
  const A = massstab(20 + Sv / mA, 84 - yS0 / mA, mA), PA = A.px;
  z.iAnsicht(A.X(-Sv), A.Y(yS0), PA(yS1 - yS0), S, PA, { senkrecht: true, teil: Sv });
  for (const yy of [yS0, yS1]) z.linie(A.X(-Sv) - 4, A.Y(yy), A.X(0) + 6, A.Y(yy), "mass", 1.0, "6 3");
  if (Sv < S.h) z.linie(A.X(-Sv), A.Y(yS0) - 4, A.X(-Sv), A.Y(yS1) + 4, "mass", 1.0, "6 3");
  if (steifen) for (const yy of [0, T.h - T.tf]) z.rect(A.X(-Sv + (Sv < S.h ? 0 : S.tf)), A.Y(yy), PA(Sv - (Sv < S.h ? 1 : 2) * S.tf), Math.max(PA(T.tf), 2), "ansicht_vorn", 0.8);
  z.rect(A.X(0), A.Y(y_top), PA(t_p), PA(y_bot - y_top), "ansicht_vorn", 1.2);
  z.iAnsicht(A.X(t_p), A.Y(0), PA(L_b), T, PA);
  z.linie(A.X(t_p + L_b), A.Y(-8), A.X(t_p + L_b), A.Y(T.h + 8), "mass", 1.0, "6 3");
  for (const yy of [0, T.h - T.tf]) {
    const aw = Math.max(PA(a_f), 3);
    z.poly([[A.X(t_p), A.Y(yy)], [A.X(t_p) + aw, A.Y(yy)], [A.X(t_p), A.Y(yy) - aw]], "naht", 0.5);
    z.poly([[A.X(t_p), A.Y(yy + T.tf)], [A.X(t_p) + aw, A.Y(yy + T.tf)], [A.X(t_p), A.Y(yy + T.tf) + aw]], "naht", 0.5);
  }
  for (const yr of reihen)
    z.schraubeSeite({ achseY: A.Y(yr), von: A.X(-S.tf), bis: A.X(t_p), d: PA(d), kopf: [PA(kopf), PA(1.6 * d)], mutter: [PA(0.8 * d), PA(1.6 * d)] });
  const xC = A.X(t_p + kopf) + 6;
  z.linie(xC, A.Y(yS0) - 4, xC, A.Y(yS1) + 2, "text", 0.9, "12 3 2 3");
  z.text(xC + 5, A.Y(yS0) + 10, "C", 15, "start", "text", true, { frei: true });
  z.text(xC + 5, A.Y(yS1) - 2, "C", 15, "start", "text", true, { frei: true });
  // Kräfte: V_Ed über dem Träger, M_Ed im Steg, N_Ed unter dem Träger
  const xEnde = A.X(t_p + L_b), Lpx = PA(L_b);
  const xV = Math.max(A.X(t_p) + Lpx * 0.7, xC + 26);
  z.kraft(xV, A.Y(0) - 46, xV, A.Y(0) - 4, "V_{Ed}", xV + 8, A.Y(0) - 24);
  const steg = PA(T.h / 2 - T.tf - T.r); // halbe gerade Steghöhe in px
  const wM = z.messe("M_{Ed}", 16, true);
  // Bogen im geraden Stegteil, Beschriftung rechts daneben (über dem Bogen läge sie bei niedrigen Trägern auf den Flanschlinien)
  const frei = xEnde - 6 - (xC + 6);
  const rM = Math.max(6, Math.min(22, steg - 4, (frei - 8 - wM) / 2));
  const cxM = Math.max(xC + 6 + rM, Math.min(A.X(t_p) + Lpx * 0.45, xEnde - 6 - wM - 8 - rM)), cyM = A.Y(T.h / 2);
  z.moment(cxM, cyM, rM, "M_{Ed}", cxM + rM + 8, cyM + 6);
  const xN = Math.min(Math.max(xEnde - 34, xC + 24), 296 - 40), yN = A.Y(Math.max(T.h, y_bot)) + 26;
  z.kraft(xN, yN, xN + 38, yN, "N_{Ed}", xN + 19, yN - 8, "middle");
  z.text(20, 50, `Stütze ${p.stuetze}`, 14);
  const yT1 = Math.max(A.Y(yS1) + 24, yN + 24);
  z.hinweis(A.X(t_p / 2), A.Y(y_bot) + 1, `Stirnplatte t_{p} = ${fmt(t_p)}`, 20, yT1);
  z.text(xEnde, yT1 + 22, `Träger ${p.traeger}`, 14, "end");
  const bA = z.massstabBalken(20, yT1 + 40, mA, balkenLaenge(mA));

  // ---------------- Schnitt C–C, Feld x 370…672 ----------------
  z.titel(380, 26, "Schnitt C–C");
  const bMax = Math.max(S.b, b_p); // Platte (≥ Trägerflansch) kann über die Stütze stehen
  const hS = y_bot - y_top + 60;
  const mS = waehleMassstab(Math.max(bMax / 190, hS / 300), [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5]);
  const xc = 426 + bMax / mS / 2;
  const B = massstab(xc, 76 - y_top / mS, mS), PB = B.px;
  z.rect(B.X(-S.b / 2), B.Y(y_top - 30), PB(S.b), PB(y_bot - y_top + 60), "ansicht_hinten", 1.0);
  for (const yy of [y_top - 30, y_bot + 30]) z.linie(B.X(-S.b / 2) - 6, B.Y(yy), B.X(S.b / 2) + 6, B.Y(yy), "mass", 1.0, "6 3");
  z.rect(B.X(-b_p / 2), B.Y(y_top), PB(b_p), PB(y_bot - y_top), "ansicht_vorn", 1.2);
  z.iProfil(xc, B.Y(T.h / 2), T, PB, "schnitt");
  for (const yr of reihen) for (const sg of [-1, 1]) z.schraubeAnsicht(B.X(sg * w / 2), B.Y(yr), PB(d) / 2);
  // Maße unten: Platte und Stützenflansch, die schmalere Kette oben (keine Hilfslinie durch eine Beschriftung)
  const yb1 = B.Y(y_bot + 30) + 20 + (b_p > S.b ? 26 : 0), yb2 = B.Y(y_bot + 30) + 20 + (b_p > S.b ? 0 : 26);
  z.massH([B.X(-b_p / 2), B.X(-w / 2), B.X(w / 2), B.X(b_p / 2)], yb1, [["e_{2}", ""], ["w", ""], ["e_{2}", ""]],
    [[B.X(-b_p / 2), B.Y(y_bot) + 2], [B.X(-w / 2), B.Y(y_bot) + 2], [B.X(w / 2), B.Y(y_bot) + 2], [B.X(b_p / 2), B.Y(y_bot) + 2]]);
  z.massH([B.X(-S.b / 2), B.X(-w / 2), B.X(w / 2), B.X(S.b / 2)], yb2, [["e_{2,c}", ""], ["w", ""], ["e_{2,c}", ""]],
    [[B.X(-S.b / 2), B.Y(y_bot + 30) + 2], [B.X(S.b / 2), B.Y(y_bot + 30) + 2]]);
  const xm = B.X(bMax / 2) + 14;
  const ys = [y_top, ...reihen, y_bot];
  z.massV(ys.map(B.Y), xm, (drei ? ["e_{x}", "p_{1}", "p_{2}", "e_{1}"] : ["e_{x}", "p_{1}", "e_{1}"]).map((l, i) => (PB(ys[i + 1] - ys[i]) >= 16 ? l : "")),
    [[B.Y(y_top), B.X(b_p / 2)], [B.Y(y_bot), B.X(b_p / 2)]]);
  const bS = z.massstabBalken(390, Math.max(yb1, yb2) + 22, mS, balkenLaenge(mS));

  // ---------------- Text ----------------
  const Tx = 712;
  z.titel(Tx, 26, "Stirnplattenstoß");
  const zeilen = [
    [`Stütze ${p.stuetze}`], [`Träger ${p.traeger}`], [`Stirnplatte ${fmt(b_p)} × ${fmt(y_bot - y_top)} × ${fmt(t_p)}`], [`${nR} × 2 ${M} ${p.fk}, ${p.stahl}`],
    [`Nähte a_{f} = ${fmt(a_f)}, a_{w} = ${fmt(a_w)}`], [steifen ? "Stütze mit Steifen" : "Stütze ohne Steifen"], [""],
    ["Abstände (mm):", true], [`e_{x} = ${fmt(ex)}, u = ${fmt(u)} (Achse–Flansch)`], [`e_{2} = ${fmt(e2p)}, w = ${fmt(w)}`], [`e_{2,c} = ${fmt(Math.round(e2c * 10) / 10)} (Stützenflansch)`], [""],
    ["Zugzone oben (Reihen 1, 2),"], [drei ? "Reihe 3: Querkraft" : "ohne Reihe 3 (Träger niedrig)"], [""],
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
