// DK-HO-02 Deltabeam-Verbundträger auf BauBuche-Stütze mit Schlitzblech und Stabdübeln
// Port von dk_ho_02() (Detailkatalog Generator, 17.10.2026), parametrisch.
import { Zeichnung, massstab, waehleMassstab, fmt } from "../js/dk.js";
import { BAUBUCHE, BRETTSCHICHTHOLZ, bauteilName } from "../js/werkstoffe.js";
import { HOLZ, KMOD, fhAlpha, fhBauBuche, BAUBUCHE_FH_QUELLE, myRk, fvRkSchlitzblech, bemessung, holzQuelle, EC5 } from "../js/holzbau.js";

export const meta = {
  id: "DK-HO-02",
  titel: "Deltabeam-Verbundträger auf BauBuche-Stütze mit Schlitzblech und Stabdübeln",
  kategorie: "Holzbau-Anschlüsse",
  beschreibung:
    "Endauflager eines Peikko-Deltabeam auf einer Stütze aus BauBuche (alternativ Brettschichtholz). Kopfplatte mit " +
    "angeschweißtem Schlitzblech quer zur Trägerachse, Stabdübel parallel zur Trägerachse durch die Seitenflächen der Stütze. " +
    "Träger-Untergurt über aufgeschweißte Gewindebolzen auf der Kopfplatte, Muttern im Trägerinneren (vor dem Verguss). " +
    "Abdichtung unter der Kopfplatte gegen Betonierwasser. Ohne eingeklebte Stahlstäbe, Verbindungsmittel nach " +
    "Bauartgenehmigung bzw. ETA. Standard: Stütze BauBuche GL75 240 × 240, 2 × 3 Stabdübel Ø16. " +
    "Schematische Ausführungsvariante, mit dem Hersteller abzustimmen.",
  nachweise: [
    "Montagezustand: Torsion T_{Ed} = F_{Ed} · e aus einseitig verlegten Deckenelementen (Verlegereihenfolge, ggf. Abstützung)",
    "Deltabeam im Bauzustand: Torsion, Querbiegung aus Deckenauflagerung, Profilverformung (Bauartgenehmigung Z-26.2-49, aktuelle Fassung prüfen)",
    "Stabdübelgruppe aus T_{Ed} (polar): F_{v,Ed,max} = T_{Ed} · r_{max} / Σ r_{i}²; Lochleibung im Holz unter Kraft-Faser-Winkel α, zwei Scherfugen je Stabdübel (Holz–Stahl–Holz), wirksame Anzahl n_{ef}",
    "Abstände der Stabdübel a_{1} bis a_{4}, insbesondere Hirnholzabstand a_{3} zum Stützenkopf; Spalten",
    "Schlitzblech: Lochleibung, Biegung und Schub aus T_{Ed}; Kehlnähte an die Kopfplatte",
    "Gewindebolzen Kopfplatte–Untergurt: Zug aus T_{Ed} / z_{b}, Abscheren",
    "Kontaktpressung Kopfplatte auf Hirnholz (f_{c,0,d}); Kopfplatte auf Biegung",
    "BauBuche nach ETA-14/0354: Stabdübel nicht in Stirnflächen; in Schmalflächen f_{h,k} × 0,8 für d ≥ 8 mm (Anhang 3); Druckfestigkeit k_{c,0} für n > 3 Lamellen; Feuchteschutz Nutzungsklasse 1/2",
  ],
  vorschau: { x0: 370, x1: 672 }, // Ausschnitt für die Kachel (px)
  faustwerte: ["BauBuche", "Stirn- und Fußplatten", "Schweißnähte"],
};

export const parameter = [
  { key: "b_s", label: "Breite b (quer zum Träger)", typ: "zahl", einheit: "mm", standard: 240, min: 160, max: 600, gruppe: "Stütze" },
  { key: "h_s", label: "Tiefe h (in Trägerachse)", typ: "zahl", einheit: "mm", standard: 240, min: 160, max: 800, gruppe: "Stütze" },
  { key: "klasse", label: "Festigkeitsklasse", typ: "auswahl", standard: "GL75", optionen: [...BAUBUCHE, ...BRETTSCHICHTHOLZ], gruppe: "Stütze" },
  { key: "flaeche", label: "Stabdübel in (BauBuche)", typ: "auswahl", standard: "schmal", gruppe: "Stütze", weitere: true,
    optionen: [{ wert: "schmal", text: "Schmalfläche (Lamellen-/Furnierkanten)" }, { wert: "seite", text: "Seitenfläche (Furnierebene)" }],
    hilfe: "ETA-14/0354: Schmalfläche f_h × 0,8 für d ≥ 8" },
  { key: "d", label: "Stabdübel d", typ: "zahl", einheit: "mm", standard: 16, min: 8, max: 24, gruppe: "Stabdübel" },
  { key: "n_q", label: "Reihen quer", typ: "zahl", einheit: "", standard: 2, min: 1, max: 4, gruppe: "Stabdübel" },
  { key: "n_l", label: "Stabdübel je Reihe", typ: "zahl", einheit: "", standard: 3, min: 2, max: 6, gruppe: "Stabdübel" },
  { key: "a1", label: "Abstand a_{1} (senkrecht)", typ: "zahl", einheit: "mm", standard: 80, min: 30, max: 200, gruppe: "Stabdübel", weitere: true },
  { key: "a2", label: "Abstand a_{2} (quer)", typ: "zahl", einheit: "mm", standard: 80, min: 30, max: 200, gruppe: "Stabdübel", weitere: true },
  { key: "a3", label: "Hirnholzabstand a_{3}", typ: "zahl", einheit: "mm", standard: 120, min: 50, max: 300, gruppe: "Stabdübel", weitere: true },
  { key: "e_s", label: "Blechrand e_{s}", typ: "zahl", einheit: "mm", standard: 40, min: 15, max: 100, gruppe: "Schlitzblech", weitere: true },
  { key: "h_db", label: "Höhe h", typ: "zahl", einheit: "mm", standard: 200, min: 200, max: 500, gruppe: "Deltabeam (schematisch)", weitere: true },
  { key: "B_db", label: "Untergurtbreite B", typ: "zahl", einheit: "mm", standard: 440, min: 300, max: 800, gruppe: "Deltabeam (schematisch)", weitere: true },
];

export const varianten = [
  { name: "bsh", roh: { klasse: "GL24h", b_s: "280", d: "20", a1: "100", a2: "100", a3: "140", e_s: "45" } },
  { name: "klein", roh: { b_s: "160", d: "12", n_q: "1", n_l: "2", a1: "60", a3: "90", e_s: "30" } },
  { name: "gross", roh: { b_s: "400", d: "24", n_q: "3", n_l: "4", a1: "120", a2: "100", a3: "170", h_db: "400", B_db: "700" } },
  { name: "zu_eng", roh: { a2: "40", a1: "50" } },
  { name: "rechteckig", roh: { b_s: "200", h_s: "400", klasse: "GL28h" } },
  { name: "seitenflaeche", roh: { flaeche: "seite" } },
  { name: "rechteckig_breit", roh: { b_s: "360", h_s: "200", n_q: "3" } },
];

export function zeichne(p, opt = {}) {
  const z = new Zeichnung(940, 520, { messe: opt.messe });
  const n_q = Math.round(p.n_q), n_l = Math.round(p.n_l);
  const { b_s, h_s, d, a1, a2, a3, e_s, h_db, B_db } = p;
  const d0 = d + 1; // Bohrung im Schlitzblech
  const name = bauteilName(p.klasse); // "BauBuche" oder "BSH"
  const stil = name === "BauBuche" ? "holz_fsh_v" : "holz_laengs_v";
  const t_k = 20, t_sb = 10; // Kopfplatte, Schlitzblech
  const a4 = (b_s - (n_q - 1) * a2) / 2;
  const xs = Array.from({ length: n_q }, (_, i) => -((n_q - 1) * a2) / 2 + i * a2); // Dübel quer (ab Achse)
  const ys = Array.from({ length: n_l }, (_, i) => a3 + i * a1); // Dübel ab Stützenkopf
  const b_sb = (n_q - 1) * a2 + 2 * e_s, h_sb = ys[n_l - 1] + e_s; // Schlitzblech
  const h_zeig = h_sb + Math.max(100, a1); // gezeigte Stützenlänge

  // ---------------- Prüfungen (DIN EN 1995-1-1, Tab. 8.5; Torsion → ungünstigster Kraft-Faser-Winkel) ----------------
  const TAB85 = name === "BauBuche" ? "DIN EN 1995-1-1, Tab. 8.5 nach ETA-14/0354, Anhang 3 „Verbindungsmittel“" : "DIN EN 1995-1-1, Tab. 8.5";
  z.pruefe("a_{3,t} Hirnholz oben (≥ max(7d; 80))", a3, Math.max(7 * d, 80), TAB85);
  if (n_l > 1) z.pruefe("a_{1} untereinander (≥ 5d)", a1, 5 * d, TAB85);
  if (n_q > 1) z.pruefe("a_{2} quer (≥ 3d)", a2, 3 * d, TAB85);
  z.pruefe("a_{4,t} Rand (≥ 4d)", a4, 4 * d, TAB85);
  z.pruefe("Schlitzblech Rand e_{s} (≥ 1,2 d_{0})", e_s, 1.2 * d0, "DIN EN 1993-1-8, Tab. 3.3");
  z.pruefe("Schlitzblech innerhalb der Stütze (≥ 20 Rand)", (b_s - b_sb) / 2, 20, "konstruktiv");

  // ---------------- Tragfähigkeit (überschlägig) ----------------
  const ALPHA = 90; // Torsion: ungünstigster Kraft-Faser-Winkel
  const t1 = (b_s - t_sb - 2) / 2; // Holzdicke je Seite neben dem Schlitz
  const bb = HOLZ[p.klasse].art === "fsh", schmal = bb && p.flaeche === "schmal";
  const fh = bb ? fhBauBuche(d, ALPHA, schmal) : fhAlpha(d, p.klasse, ALPHA);
  const Fv = bemessung(2 * fvRkSchlitzblech(fh, t1, d, myRk(d)), KMOD.kurz); // je Stabdübel, 2 Scherfugen
  const yc = (ys[0] + ys[n_l - 1]) / 2;
  const r2 = xs.flatMap((x) => ys.map((y) => x * x + (y - yc) ** 2));
  const rmax = Math.sqrt(Math.max(...r2)), sr2 = r2.reduce((u, v) => u + v, 0);
  const T_Rd = rmax > 0 ? (Fv * sr2) / rmax / 1000 : 0; // kNm
  const quelleH = bb ? `${EC5}, 8.2.3 / 8.5 mit ${BAUBUCHE_FH_QUELLE}${schmal && d >= 8 ? ": f_{h,k} × 0,8 (Schmalfläche, d ≥ 8)" : ""}`
    : `${EC5}, 8.2.3 / 8.5 – ${holzQuelle(p.klasse)}`;
  z.widerstand("T_{Rd}", `Stabdübelgruppe ${n_q} × ${n_l} Ø${fmt(d)}, α = 90°, k_{mod} = 0,9 (Montage)`, T_Rd, "kNm", quelleH);
  const e_F = B_db / 2 + 110 / 2 - 30; // Lage der Deckenauflagerkraft (wie in der Zeichnung)
  z.widerstand("F_{Ed,max}", `einseitige Deckenlast bei e ≈ ${fmt(Math.round(e_F))} mm (T_{Rd} / e)`, (T_Rd * 1000) / e_F, "kN", "aus T_{Rd}");
  const fc0 = HOLZ[p.klasse].fc0;
  z.widerstand("V_{Rd}", `Kopfplatte auf Hirnholz ${fmt(b_s)} × ${fmt(h_s)}, k_{mod} = 0,8`, bemessung((b_s * h_s * fc0) / 1000, KMOD.mittel), "kN", `${EC5}, 6.1.4 – ${holzQuelle(p.klasse)}`);
  z.tragHinweise.push(
    `Je Stabdübel F_{v,Rd} ≈ ${fmt(Math.round(Fv * 10) / 10)} kN (2 Scherfugen, Holz–Stahl–Holz, t_{1} = ${fmt(Math.round(t1))} mm)`,
    "Ohne Abminderung n_{ef}, Blockscheren und Querzug; Stahlblech, Kopfplatte und Gewindebolzen nicht enthalten",
    ...(bb ? [`BauBuche: ρ_{k} = 730, f_{h,0,k} = 0,082 (1 – 0,01 d) ρ_{k}, k_{90} = 1,30 + 0,015 d${schmal && d >= 8 ? ", × 0,8 in der Schmalfläche" : ""}; f_{c,0,k} = 49,5 (NKL 2) nach ETA-14/0354`] : []),
  );

  // ---------------- Maßstab (beide Felder gleich) ----------------
  const deckeB = 110; // Breite der gezeigten Decke im Schnitt
  const m = waehleMassstab(Math.max((B_db + 2 * deckeB) / 286, (h_db + t_k + h_zeig) / 330, b_s / 150, h_s / 160), [1.5, 2, 2.5, 3, 4, 5, 6]);
  const yTop = 140; // OK Deltabeam in px
  const yKP = yTop + h_db / m; // OK Kopfplatte = UK Deltabeam
  const yK = yKP + t_k / m; // Stützenkopf
  const P = (mm) => mm / m;

  // ---------------- Ansicht, Feld x 0…300 ----------------
  z.titel(20, 26, "Ansicht");
  const xA = 50 + P(h_s) / 2 + 10; // Stützenachse
  const A = (x) => xA + x / m;
  const ysA = (y) => yK + y / m;
  const xEnde = 286;
  const xBeam0 = A(-h_s / 2 - 25);
  // Stütze, Kopfplatte, Träger
  z.rect(A(-h_s / 2), yK, P(h_s), P(h_zeig), stil, 1.2);
  z.linie(A(-h_s / 2) - 6, ysA(h_zeig), A(h_s / 2) + 6, ysA(h_zeig), "mass", 1.0, "6 3");
  z.rect(A(-h_s / 2 - 15), yKP, P(h_s + 30), P(t_k), "ansicht_vorn", 1.0);
  const tu = Math.max(P(15), 4), to = Math.max(P(10), 3);
  z.rect(xBeam0 + 10, yTop + to, xEnde - xBeam0 - 10, yKP - tu - yTop - to, "ansicht_hinten", 1.0);
  z.rect(xBeam0 + 24, yTop, xEnde - xBeam0 - 24, to, "ansicht_vorn", 1.0);
  z.rect(xBeam0, yKP - tu, xEnde - xBeam0, tu, "ansicht_vorn", 1.0);
  z.linie(xEnde, yTop - 6, xEnde, yKP + 6, "mass", 1.0, "6 3");
  const rO = Math.min(P(h_db) * 0.22, 18);
  for (let x = A(h_s / 2) + 2 * rO; x < xEnde - rO - 6; x += 4 * rO) z.kreis(x, (yTop + yKP) / 2, rO, "ansicht_vorn");
  // Schlitzblech (verdeckt, Kante) und Stabdübel (verdeckt)
  const sb = (y) => z.linie(A(-t_sb / 2), y, A(t_sb / 2), y, "mass", 1.2, "5 3");
  z.linie(A(-t_sb / 2), yK, A(-t_sb / 2), ysA(h_sb), "mass", 1.2, "5 3");
  z.linie(A(t_sb / 2), yK, A(t_sb / 2), ysA(h_sb), "mass", 1.2, "5 3");
  sb(ysA(h_sb));
  for (const y of ys) z.linie(A(-h_s / 2), ysA(y), A(h_s / 2), ysA(y), "mass", 1.6, "5 3");
  z.kraft(A(-h_s / 4), yTop - 52, A(-h_s / 4), yTop - 4, "V_{Ed}", A(-h_s / 4) - 8, yTop - 32, "end");
  z.schnittlinie(A(0) + 8, yTop - 26, A(0) + 8, ysA(h_zeig) + 20, "A");
  z.text(296, yTop - 28, "Deltabeam", 14, "end");
  z.text(296, yTop - 10, "(schematisch)", 14, "end");
  // Beschriftung rechts neben der Stütze, bei breiter Stütze darunter
  const rechts = A(h_s / 2) + 22 + 118 <= 300;
  const xL = rechts ? A(h_s / 2) + 22 : 20, yL = rechts ? yK : ysA(h_zeig) + 12;
  if (rechts) z.hinweis(A(h_s / 2 + 15) - 2, yKP + P(t_k) / 2, "Kopfplatte mit", xL, yL + 30, "start", ["Schlitzblech"]);
  else z.hinweis(A(-h_s / 2 - 15) + 1, yKP + P(t_k), "Kopfplatte mit Schlitzblech", 20, yL + 30);
  z.text(xL, yL + (rechts ? 88 : 54), `Stütze ${name} ${fmt(b_s)} × ${fmt(h_s)}`.slice(0, rechts ? 99 : 99).replace(/ (\d+ × \d+)$/, rechts ? "" : " $1"), 14);
  z.text(xL, yL + (rechts ? 106 : 72), rechts ? `${fmt(b_s)} × ${fmt(h_s)}` : p.klasse, 14);
  if (rechts) z.text(xL, yL + 124, p.klasse, 14);
  const hs = z.hinweis(A(h_s / 2) - 2, ysA(ys[n_l - 1]), `Stabdübel Ø${fmt(d)}`, rechts ? xL : 160, rechts ? Math.max(yK + 158, ysA(ys[n_l - 1]) + 24) : yL + 72);
  let unten = Math.max(hs.y1, ysA(h_zeig) + 24, rechts ? 0 : yL + 76);

  // ---------------- Schnitt A–A, Feld x 370…672 ----------------
  z.titel(380, 26, "Schnitt A–A (Montagezustand)");
  const xS = 668 - (B_db / 2 + deckeB) / m; // Trägerachse
  const S = (x) => xS + x / m;
  const ysS = ysA;
  // Decke rechts verlegt, links noch nicht
  const yDo = yTop + Math.max(P(h_db - 140), to) , yDu = yKP - tu;
  z.rect(S(B_db / 2 - 20), yDo, S(B_db / 2 + deckeB) - S(B_db / 2 - 20), yDu - yDo, "beton", 1.0);
  for (const [x1, y1, x2, y2] of [[372, yDo, S(-B_db / 2 + 20), yDo], [S(-B_db / 2 + 20), yDo, S(-B_db / 2 + 20), yDu], [372, yDu, S(-B_db / 2 + 20), yDu]])
    z.linie(x1, y1, x2, y2, "mass", 1.0, "5 3");
  z.text(376, yDo - 26, "noch nicht", 14, "start", "mass");
  z.text(376, yDo - 8, "verlegt", 14, "start", "mass");
  // Deltabeam: geneigte Stege, Obergurt, Untergurt, Beton im Kasten
  const bo = Math.min(200, B_db * 0.45), bu = Math.min(B_db - 2 * 60, bo + 2 * (h_db - 30) * 0.32);
  const tw = 8;
  z.poly([[S(-bu / 2 + tw), yKP - tu], [S(-bo / 2 + tw), yTop + to], [S(bo / 2 - tw), yTop + to], [S(bu / 2 - tw), yKP - tu]], "beton", 0.6);
  z.poly([[S(-bu / 2 - 4), yKP - tu], [S(-bo / 2), yTop + to], [S(-bo / 2 + tw), yTop + to], [S(-bu / 2 + tw), yKP - tu]], "schnitt", 1.0);
  z.poly([[S(bu / 2 + 4), yKP - tu], [S(bo / 2), yTop + to], [S(bo / 2 - tw), yTop + to], [S(bu / 2 - tw), yKP - tu]], "schnitt", 1.0);
  z.rect(S(-B_db / 2), yKP - tu, P(B_db), tu, "schnitt", 1.0);
  z.rect(S(-bo / 2 - 10), yTop, P(bo + 20), to, "schnitt", 1.0);
  // Gewindebolzen mit Muttern im Kasten
  for (const xb of [-(b_s / 2 - 50), b_s / 2 - 50]) {
    z.rect(S(xb) - Math.max(P(8), 2), yKP - tu - 10, 2 * Math.max(P(8), 2), tu + 10 + P(t_k) * 0.5, "schraube", 0.8);
    z.rect(S(xb) - Math.max(P(20), 5), yKP - tu - 8, 2 * Math.max(P(20), 5), 4, "schraube", 0.8);
  }
  // Kopfplatte, Stütze, Schlitzblech, Stabdübel
  z.rect(S(-b_s / 2 - 15), yKP, P(b_s + 30), P(t_k), "schnitt", 1.0);
  z.rect(S(-b_s / 2), yK, P(b_s), P(h_zeig), stil, 1.2);
  z.linie(S(-b_s / 2) - 6, ysS(h_zeig), S(b_s / 2) + 6, ysS(h_zeig), "mass", 1.0, "6 3");
  z.linie(S(-b_s / 2 - 15) - 2, yK - 1, S(b_s / 2 + 15) + 2, yK - 1, "hinweis", 3.0);
  z.rect(S(-b_sb / 2), yK, P(b_sb), P(h_sb), "schnitt", 1.0);
  const r = P(d) / 2;
  for (const y of ys) for (const x of xs) z.kreis(S(x), ysS(y), r, "schraube", 0.8);
  // Achse, Kraft, Torsion
  z.linie(S(0), yTop - 40, S(0), ysS(h_zeig), "achse", 1.0, "12 3 2 3");
  const e = B_db / 2 + deckeB / 2 - 30;
  const xF = S(B_db / 2 + deckeB / 2 - 20);
  z.kraft(xF, 52, xF, yDo - 4, "F_{Ed}", xF - 8, 68, "end");
  z.massH([S(0), xF], 96, ["e"], [[S(0), 90], [xF, 90]]);
  const rT1 = Math.min(22, P(h_db) * 0.3);
  const wT = z.messe("T_{Ed}", 16, true);
  z.moment(S(0), (yTop + yKP) / 2 + 4, rT1, "T_{Ed}", S(-bo / 2) - 8 - wT, yTop - 12);
  const yMd = ysS((ys[0] + ys[n_l - 1]) / 2);
  const rT2 = Math.max(P(Math.max((n_l - 1) * a1, (n_q - 1) * a2)) / 2 + 14, 26);
  z.moment(S(0), yMd, rT2, "T_{Ed}", Math.max(374, Math.min(S(0) - rT2 - 10, S(-b_s / 2) - 6) - wT), yMd + 6);
  // Maße
  const xm = S(b_s / 2) + 22;
  z.massV([yK, ...ys.map(ysS)], xm, ["a_{3}", ...ys.slice(1).map(() => "a_{1}")].map((l, i) => (P(i === 0 ? a3 : a1) >= 15 ? l : "")),
    [[yK, S(b_s / 2 + 15)], ...ys.map((y) => [ysS(y), S(xs[n_q - 1]) + r + 3])]);
  z.massV([ysS(ys[n_l - 1]), ysS(h_sb)], xm, [P(e_s) >= 15 ? "e_{s}" : ""], [[ysS(h_sb), S(b_sb / 2)]]);
  const yb = ysS(h_zeig) + 20;
  const qx = [S(-b_s / 2), ...xs.map(S), S(b_s / 2)];
  z.massH(qx, yb, ["a_{4}", ...xs.slice(1).map(() => "a_{2}"), "a_{4}"], qx.map((x, i) => [x, i === 0 || i === qx.length - 1 ? ysS(h_zeig) + 2 : ysS(ys[n_l - 1]) + r + 3]));
  z.hinweis(S(-b_s / 2 - 15) - 1, yK, "Abdichtung", 376, yK + 22);
  unten = Math.max(unten, yb + 8);
  const bmS = z.massstabBalken(380, yb + 24, m, balkenLaenge(m));
  unten = Math.max(unten, bmS.y1);

  // ---------------- Text ----------------
  const T = 712;
  z.titel(T, 26, "Lastabtragung");
  const zeilen = [
    ["Montagezustand:", true], ["Decke nur einseitig verlegt"], [""],
    ["T_{Ed} = F_{Ed} · e", true, "kraft"], [""],
    ["Dübelgruppe (polar):", true], ["F_{v,Ed,max} = T_{Ed} · r_{max} / Σ r_{i}²"], ["Kraft-Faser-Winkel beachten"], ["2 Scherfugen je Stabdübel"], [""],
    ["V_{Ed}: Kontakt Kopfplatte"], ["auf Hirnholz"], [""],
    ["Endzustand:", true], ["beidseitig verlegt, T_{Ed} klein"], [""],
    ["Schnitt A–A maßstäblich:", true], [`Stütze ${fmt(b_s)} × ${fmt(h_s)}, Stabdübel Ø${fmt(d)},`],
    [`a_{3} = ${fmt(a3)}, a_{1} = ${fmt(a1)}, a_{2} = ${fmt(a2)},`], [`a_{4} = ${fmt(a4)}, e_{s} = ${fmt(e_s)} mm`],
    [`Maßstab 1 px = ${fmt(m)} mm`, false, "mass"],
  ];
  let y = 50;
  for (const [t, f, art] of zeilen) {
    if (t) { z.text(T, y, t, 14, "start", art || "text", !!f); y += 20; } else y += 8;
  }
  unten = Math.max(unten, y - 16);

  const legende = [[stil, name === "BauBuche" ? "BauBuche" : "Holz, Faser in Zeichenebene"], ["beton", "Beton"],
    ["schnitt", "Stahl im Schnitt"], ["schraube", "Stabdübel, Bolzen"], ["ansicht_vorn", "Ansicht"]];
  const yl = z.legende(legende, 20, unten + 16, 300);
  z.h = yl + 8;
  return z;
}

function balkenLaenge(m) {
  for (const l of [20, 50, 100, 200, 250, 500, 1000, 2000]) if (l / m >= 40) return l;
  return 2000;
}
