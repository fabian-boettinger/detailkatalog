// DK-HO-03 Deltabeam-Randträger mit Holz-Beton-Verbunddecke
// Port von dk_ho_03() (Detailkatalog Generator, Stand 21.10.2026 (2)), parametrisch.
import { Zeichnung, massstab, waehleMassstab, fmt, laengsLagen, bspTyp } from "../js/dk.js";
import { NADELHOLZ, BSP_LAGENFOLGE } from "../js/werkstoffe.js";
import { KMOD, bemessung, EC5 } from "../js/holzbau.js";
import { BSP_OPTIONEN, KLED_OPTIONEN, bspKennwerte, kmodText, HBV, hbvParameter, hbvNachweise, HBV_NACHWEISE } from "../js/hersteller.js";

export const meta = {
  id: "DK-HO-03",
  titel: "Deltabeam-Randträger mit Holz-Beton-Verbunddecke",
  kategorie: "Holzbau-Anschlüsse",
  beschreibung:
    "Randauflager einer HBV-Decke (Brettsperrholz mit Aufbeton) auf dem Untergurt eines Peikko-Deltabeam-Randträgers. " +
    "Das Holzelement (Standard BSP L8s 300 mit doppelten Längslagen, 80 mm Aufbeton) liegt direkt auf dem Untergurt. " +
    "Am Auflager ist das BSP bereichsweise bis auf die unteren Lagen ausgefräst (Taschen); Taschen, Fuge zwischen Holz " +
    "und Trägersteg und Trägerkern werden mit dem Aufbeton vergossen, die Holzstirn an der Fuge ist abgedichtet. " +
    "Decke nur auf einer Seite: Torsion im Träger dauerhaft. Lastabtrag der Torsion über ein Kräftepaar: Druck im Aufbeton " +
    "oben, Zug in der Anschlussbewehrung unten (Bügel im Trägerkern, durch die Stegöffnung, verankert im Taschenbeton). " +
    "Schrauben durch den Untergurt nur zur Lagesicherung. Schnitt durch eine Tasche; zwischen den Taschen volles BSP mit " +
    "HBV-Schrauben. Schematische Ausführungsvariante, Trägertyp und Details mit dem Hersteller abzustimmen.",
  nachweise: [
    "Torsion je m Trägerlänge m_{T,Ed} = V_{Ed} · e (Randträger, dauerhaft)",
    "Kräftepaar (Träger kippt oben zur Decke hin): D_{Ed} = Z_{Ed} = m_{T,Ed} / d je m; Zug je Tasche Z_{Ed} · a_{T} (Taschenabstand a_{T})",
    "Anschlussbewehrung: Stahlzug f_{yd}, Verankerung im Taschenbeton ab Holzstirn l_{bd} (Verbundbereich, Tasche kurz halten), Verankerung im Trägerkern, Lage der Stegöffnung nach Trägertyp",
    "Druck D_{Ed} im Aufbeton gegen den Trägersteg (Betondruck, Verguss der Fuge)",
    "BSP-Restquerschnitt in der Tasche: Querdruck auf dem Untergurt, Schub; an der Taschenkante (Ausklinkung) Querzug und Rollschub beim Übergang in den vollen Querschnitt; Lastweiterleitung zwischen Taschen und vollem Querschnitt",
    "Montagezustand: Holz und Frischbeton ohne Verbund, Taschen noch nicht vergossen: kein Kräftepaar, Torsion über Kastenquerschnitt zu den Stützen oder Abstützung",
    "Deltabeam: Torsion, Querbiegung des Untergurts aus Deckenauflager, Profilverformung (Bauartgenehmigung Z-26.2-49, aktuelle Fassung und Herstellerbemessung)",
    "Auflagerpressung Holz direkt auf Stahl quer zur Faser (f_{c,90,d}, k_{c,90}), Auflagertiefe b_{A}; Kantenpressung an der Untergurtkante",
    "HBV-Verbund zwischen den Taschen: Schubfluss nahe dem Auflager, Abstand der ersten Schraubenpaare zur Holzstirn und zu den Taschen",
    ...HBV_NACHWEISE,
    "Vergussfuge und Taschen: Betonierbarkeit (Größtkorn, Entlüftung), Abdichtung der Holzflächen gegen Betonierwasser",
    "Brandschutz: freiliegender Untergurt, Abbrand der Holzunterseite am Auflager (Restquerschnitt)",
    "Schallschutz: Lagerung ohne Elastomer mit dem Schallschutznachweis abstimmen (Flankenübertragung, DIN 4109 / DIN EN 12354); Aufbeton läuft starr in den Träger, ein Streifen nur unter dem Holz entkoppelt deshalb wenig",
  ],
  vorschau: { x0: 0, x1: 672 }, // Ausschnitt für die Kachel (px)
  faustwerte: ["Bewehrung", "Stirn- und Fußplatten"],
};

export const parameter = [
  { key: "bsp", label: "BSP-Aufbau", typ: "profil", reihe: "BSP", standard: "BSP L8s 300 (40-40-30-40-40-30-40-40)",
    fuellt: { lagen: "lagen", aufbau: "aufbau" }, gruppe: "Decke" },
  { key: "lagen", label: "Lagen von oben", typ: "lagen", einheit: "mm", standard: "40-40-30-40-40-30-40-40", gruppe: "Decke", weitere: true },
  { key: "aufbau", label: "Lagenfolge", typ: "auswahl", standard: "doppelt", optionen: BSP_LAGENFOLGE, gruppe: "Decke", weitere: true },
  { key: "klasse_bsp", label: "BSP-Lamellen", typ: "auswahl", standard: "C24", optionen: NADELHOLZ, gruppe: "Decke", weitere: true },
  { key: "bsp_hst", label: "BSP-Hersteller", typ: "auswahl", standard: "allgemein", optionen: BSP_OPTIONEN, gruppe: "Decke", weitere: true },
  { key: "h_c", label: "Aufbeton h_{c}", typ: "zahl", einheit: "mm", standard: 80, min: 50, max: 160, gruppe: "Decke" },
  { key: "n_r", label: "Restlagen in der Tasche", typ: "zahl", einheit: "", standard: 2, min: 1, max: 4, gruppe: "Tasche", weitere: true },
  { key: "l_v", label: "Verankerung ab Holzstirn", typ: "zahl", einheit: "mm", standard: 510, min: 200, max: 900, gruppe: "Tasche", weitere: true },
  { key: "d_b", label: "Anschlussbewehrung Ø", typ: "zahl", einheit: "mm", standard: 12, min: 8, max: 20, gruppe: "Tasche" },
  { key: "c_nom", label: "Betondeckung c_{nom}", typ: "zahl", einheit: "mm", standard: 25, min: 15, max: 40, gruppe: "Tasche", weitere: true },
  { key: "a_T", label: "Taschenabstand a_{T}", typ: "zahl", einheit: "mm", standard: 625, min: 300, max: 2500, gruppe: "Tasche", weitere: true },
  { key: "b_A", label: "Auflagertiefe b_{A}", typ: "zahl", einheit: "mm", standard: 130, min: 60, max: 250, gruppe: "Auflager" },
  { key: "fuge", label: "Vergussfuge unten", typ: "zahl", einheit: "mm", standard: 37, min: 10, max: 100, gruppe: "Auflager", weitere: true },
  ...hbvParameter("HBV-Verbund", 200),
  { key: "kled", label: "Lasteinwirkungsdauer", typ: "auswahl", standard: "mittel", optionen: KLED_OPTIONEN, gruppe: "Bemessung", weitere: true },
];

export const varianten = [
  { name: "ctc", roh: { hbv: "ctc", hbv_d: "7", hbv_lef: "80", bsp_hst: "storaenso" } },
  { name: "L5", roh: { bsp: "BSP L5 200 (40-40-40-40-40)", h_c: "100", b_A: "120" } },
  { name: "L7_dick", roh: { bsp: "BSP L7 280 (40-40-40-40-40-40-40)", h_c: "120", n_r: "3", d_b: "16", l_v: "700" } },
  { name: "duenn", roh: { bsp: "BSP L3 120 (40-40-40)", h_c: "60", n_r: "1", l_v: "300", d_b: "10" } },
  { name: "zu_kurz", roh: { l_v: "300", fuge: "20" } },
];

export function zeichne(p, opt = {}) {
  const z = new Zeichnung(940, 500, { messe: opt.messe, felder: [{ name: "Schnitt", x0: 0, x1: 672 }, { name: "Text", x0: 712, x1: 940 }] });
  const { h_c, l_v, d_b, c_nom, b_A, fuge } = p;
  const lagen = p.lagen;
  const n_r = Math.min(Math.round(p.n_r), lagen.length - 1);
  const laengs = laengsLagen(lagen.length, p.aufbau);
  const h_h = lagen.reduce((a, b) => a + b, 0);
  const h_rest = lagen.slice(lagen.length - n_r).reduce((a, b) => a + b, 0);
  // Träger schematisch: OK Träger = OK Aufbeton
  const t_u = 20, t_o = 10, t_s = 12, t_w = 8;
  const y_ug = h_c + h_h, h_tr = y_ug + t_u;
  const steg_o = 170, steg_u = steg_o + 0.16 * (y_ug - t_o), x_og = steg_o + 10;
  const steg_x = (yy) => steg_o + ((steg_u - steg_o) * (yy - t_o)) / (y_ug - t_o);
  const x_holz = steg_u + t_w + fuge, x_ug = x_holz + b_A;
  const x_b_ende = x_holz + l_v, x_tasche = x_b_ende + 30, x_ende = x_tasche + 260;
  const y_tasche = y_ug - h_rest;
  const y_z = y_tasche - c_nom - d_b / 2, y_D = Math.min(22, h_c / 3);
  const d_ls = 8, d0_ls = 9, x_ls = x_ug - Math.max(2 * d0_ls, 35);
  const achse = 110, x_auf = (x_holz + x_ug) / 2;
  const t_ab = 2; // Abdichtung Holzstirn

  // ---------------- Prüfungen (Norm bzw. Annahme, im Projekt bestätigen) ----------------
  z.pruefe("Auflagertiefe b_{A} auf Untergurt (≥ 100)", b_A, 100, "Annahme");
  z.pruefe("Vergussfuge Holz–Steg unten (≥ 2 × Größtkorn 16)", fuge, 32, "konstruktiv");
  z.pruefe("Betondeckung Zugbewehrung zum Taschengrund", y_tasche - (y_z + d_b / 2), c_nom, "DIN EN 1992-1-1");
  z.pruefe("Verankerung ab Holzstirn (l_{b,rqd} ≈ 40 Ø, C25/30)", l_v, 40 * d_b, "Faustwert FW-BW-02");
  z.pruefe("Lagesicherung Randabstand im Untergurt (≥ 2 d_{0})", x_ug - x_ls, 2 * d0_ls, "konstruktiv");

  // ---------------- Tragfähigkeit (überschlägig) ----------------
  const As = (Math.PI * d_b ** 2) / 4;
  z.widerstand("Z_{Rd}", `Anschlussbewehrung Ø${fmt(d_b)}, B500, f_{yd} = 435`, (As * 435) / 1000, "kN", "DIN EN 1992-1-1, 3.2");
  z.widerstand("Z_{Rd}", `Verbund im Taschenbeton über l = ${fmt(l_v)}, f_{bd} = 2,7 (C25/30)`, (Math.PI * d_b * l_v * 2.7) / 1000, "kN", "DIN EN 1992-1-1, 8.4.2");
  const Zrd = Math.min(...z.widerstaende.map((w) => w.wert));
  const hebel = y_z - y_D, e_T = x_auf - achse;
  const mT = (Zrd * hebel) / p.a_T; // kNm/m
  z.widerstand("m_{T,Rd}", `Kräftepaar Z_{Rd} · d / a_{T} (d = ${fmt(Math.round(hebel))}, a_{T} = ${fmt(p.a_T)})`, mT, "kNm/m", "aus Z_{Rd}");
  z.widerstand("v_{Rd}", `Auflagerkraft aus Torsion m_{T,Rd} / e (e = ${fmt(Math.round(e_T))})`, (mT * 1000) / e_T, "kN/m", "aus m_{T,Rd}");
  const kmod = KMOD[p.kled];
  const tQ = Math.max(...lagen.filter((_, i) => !laengs[i]), 0);
  const bk = bspKennwerte(p.bsp_hst, p.klasse_bsp, tQ);
  z.widerstand("v_{Rd}", `Querdruck Holz auf Untergurt, b_{A} = ${fmt(b_A)} (k_{c,90} = 1,0, k_{mod} = ${kmodText(p.kled)})`, bemessung(bk.fc90 * b_A, kmod), "kN/m", `${EC5}, 6.1.5 – f_{c,90,k} = ${fmt(bk.fc90)} nach ${bk.quelle}`);
  // Restquerschnitt in der Tasche: Schub über die unteren n_r Lagen, mit Querlage Rollschub maßgebend (τ = 1,5 v / h)
  const restQuer = laengs.slice(lagen.length - n_r).some((l) => !l);
  const fSchub = restQuer ? bk.fr : bk.fv;
  z.widerstand("v_{Rd}", `Restquerschnitt in der Tasche h = ${fmt(h_rest)}, ${restQuer ? `Rollschub f_{r,k} = ${fmt(bk.fr)}` : `Schub f_{v,k} = ${fmt(bk.fv)}`} (τ = 1,5 v / h)`,
    bemessung((h_rest * fSchub) / 1.5, kmod), "kN/m", `${EC5}, 6.1.7 – ${bk.quelle}`);
  z.tragHinweise.push("Je Tasche ein Bügelschenkel angenommen; Druck D im Aufbeton, Deltabeam und Montagezustand nicht enthalten",
    "Auflagerkraft v je m Trägerlänge; maßgebend der kleinere Wert aus Torsion und Querdruck");
  hbvNachweise(z, p, { h_holz: h_h, h_c, rho: bk.rho });

  // ---------------- Maßstab ----------------
  const x0 = 50;
  const m = waehleMassstab(Math.max(x_ende / (612 - x0), h_tr / 230), [1.5, 2, 2.5, 3, 4]);
  const D = massstab(x0, 116, m);
  const { X, Y } = D, P = D.px;

  z.titel(20, 26, "Lastabtrag Torsion, Schnitt durch eine Tasche");

  // BSP (alle Lagen), darüber der Beton mit Tasche
  const lagenOben = lagen.map((_, i) => h_c + lagen.slice(0, i).reduce((u, v) => u + v, 0));
  const zielRest = x_tasche - 90; // Hinweis Restquerschnitt
  // zwei Blöcke: volle Lagen hinter der Tasche, Restlagen ab der Holzstirn
  const nO = lagen.length - n_r;
  // Hinweis „Tasche“: Linie senkrecht durch die Lücke zwischen den Texten Lagesicherung und Restquerschnitt
  const blX0 = Math.max(X(x_ls) + 6, 200);
  const blX1 = blX0 + Math.max(z.messe("Lagesicherung,", 14, false), z.messe("z. B. e ≈ 500", 14, false));
  const brX0 = Math.max(blX1 + 40, X(zielRest) - 30);
  const xTaPx = Math.min(Math.max((blX1 + brX0) / 2, X(x_holz) + 10), X(x_tasche) - 10);
  const xTa = (xTaPx - x0) * m;
  z.bsp(X(x_tasche), Y(h_c), P(x_ende - x_tasche), lagen.slice(0, nO).map(P), 0,
    { frei: (i, a, b) => [a + 4, b - 4], lamellePx: P(150), laengs: laengs.slice(0, nO) });
  const freiR = (i, a, b) => groessteLuecke(Math.max(a, X(x_ug) + 6), b - 4,
    [[X(zielRest) - 8, X(zielRest) + 8], [X(xTa) - 10, X(xTa) + 10]]);
  z.bsp(X(x_holz), Y(y_tasche), P(x_ende - x_holz), lagen.slice(nO).map(P), 0,
    { frei: freiR, lamellePx: P(150), laengs: laengs.slice(nO) });
  z.poly([[X(t_s), Y(t_o)], [X(x_og), Y(t_o)], [X(x_og), Y(0)], [X(x_ende), Y(0)], [X(x_ende), Y(h_c)],
    [X(x_tasche), Y(h_c)], [X(x_tasche), Y(y_tasche)], [X(x_holz), Y(y_tasche)], [X(x_holz), Y(y_ug)], [X(t_s), Y(y_ug)]], "beton", 0.8);
  // Abdichtung der Holzstirn zur Vergussfuge (Holz an Beton)
  const tA = Math.max(P(t_ab), 3);
  z.rect(X(x_holz) - tA, Y(y_tasche), tA, P(y_ug - y_tasche), "daemm", 0.5);
  // Stahl
  z.rect(X(0), Y(y_ug), P(x_ug), P(t_u), "schnitt", 1.0);
  z.rect(X(0), Y(0), P(t_s), P(y_ug), "schnitt", 1.0);
  z.rect(X(0), Y(0), P(x_og), P(t_o), "schnitt", 1.0);
  z.poly([[X(steg_o), Y(t_o)], [X(steg_o + t_w), Y(t_o)], [X(steg_u + t_w), Y(y_ug)], [X(steg_u), Y(y_ug)]], "schnitt", 1.0);
  const y1 = y_z - 40, y2 = y_z + 40; // untere Stegöffnung Ø 80, mit Beton gefüllt
  z.poly([[X(steg_x(y1) - 1), Y(y1)], [X(steg_x(y1) + t_w + 1), Y(y1)], [X(steg_x(y2) + t_w + 1), Y(y2)], [X(steg_x(y2) - 1), Y(y2)]], "beton", 0);
  // Mattenbewehrung, Anschlussbewehrung (Bügel), Lagesicherung
  for (let xm = x_holz + 25; xm < x_ende - 60; xm += 150) z.kreis(X(xm), Y(Math.min(40, h_c / 2)), Math.max(P(4), 1.6), "schraube", 0.6);
  z.rect(X(40), Y(y_z - d_b / 2), P(x_b_ende - 40), Math.max(P(d_b), 2), "schraube", 0.6);
  z.rect(X(40), Y(60), Math.max(P(d_b), 2), P(y_z + d_b / 2 - 60), "schraube", 0.6);
  z.rect(X(x_ls) - P(d_ls) / 2, Y(y_ug - Math.min(60, h_rest - 15)), P(d_ls), P(t_u + Math.min(60, h_rest - 15)), "schraube", 0.6);
  z.rect(X(x_ls) - P(20) / 2, Y(h_tr), P(20), Math.max(P(7), 2), "schraube", 0.6);
  z.linie(X(x_ende), Y(-10), X(x_ende), Y(y_ug + 10), "mass", 1.0, "6 3");

  // Achse, Last, Torsion, Kräftepaar
  z.kraft(X(x_auf), Y(0) - 80, X(x_auf), Y(0) - 4, "V_{Ed}", X(x_auf) + 8, Y(0) - 62);
  z.massH([X(achse), X(x_auf)], Y(0) - 50, ["e"], [[X(achse), Y(0) - 56], [X(x_auf), Y(0) - 56]]);
  // Torsionspfeil im Trägerkern, Text darunter über der Anschlussbewehrung; Achse dort unterbrochen
  const yTl = Y(y_z) - P(d_b) / 2 - 6, yT = Math.max(yTl - 40, Y(t_o) + 24);
  const wm = z.messe("m_{T,Ed}", 16, true);
  z.moment(X(achse), yT, 20, "m_{T,Ed}", X(achse) - wm / 2 + 4, yTl);
  z.linie(X(achse), Y(0) - 12, X(achse), yTl - 18, "achse", 1.0, "12 3 2 3");
  z.linie(X(achse), yTl + 6, X(achse), Y(h_tr) + 10, "achse", 1.0, "12 3 2 3");
  const xD0 = x_holz + 190;
  z.kraft(X(xD0), Y(y_D), X(steg_x(y_D) + t_w) + 4, Y(y_D), "D_{Ed}", X(steg_x(y_D) + t_w) + 12, Y(y_D) + 22);
  const xZ0 = x_holz + 200, xZ1 = Math.min(x_b_ende - 30, xZ0 + 320);
  z.kraft(X(xZ0), Y(y_z) - 10, X(xZ1), Y(y_z) - 10, "Z_{Ed}", X(xZ1) + 6, Y(y_z) - 4);
  z.massV([Y(y_D), Y(y_z)], X(xD0 - 30), ["d"], null, "rechts", { frei: true });
  z.massV([Y(0), Y(h_c), Y(y_tasche), Y(y_ug)], X(x_ende) + 12, ["h_{c}", "h_{F}", "h_{R}"],
    [[Y(0), X(x_ende)], [Y(h_c), X(x_ende)], [Y(y_tasche), X(x_ende)], [Y(y_ug), X(x_ende)]]);

  // Bezeichnungen oben
  z.hinweis(X(steg_x(y_z + 20)) - 1, Y(y_z + 20), "untere Stegöffnung", 20, Y(0) - 22);
  const xAb = X(x_auf) + 56; // rechts neben V_{Ed}
  z.hinweis(Math.min(xAb + 60, X(x_b_ende - 20)), Y(y_z) - P(d_b) / 2, "Anschlussbewehrung (Zug)", xAb, Y(0) - 22);
  // Bezeichnungen unten
  const yb = Y(h_tr) + 6;
  z.hinweis(X(30), Y(h_tr), "Deltabeam-", 20, yb + 46, "start", ["Randträger", "(schematisch)"]);
  const bl = z.hinweis(X(x_ls) + 3, Y(h_tr) + 4, "Lagesicherung,", blX0, yb + 46, "start", ["z. B. e ≈ 500"]);
  const br = z.hinweis(X(zielRest), Y(y_ug) - P(lagen[lagen.length - 1]) / 2, "BSP-Restquerschnitt", brX0, yb + 46, "start", [`(untere ${n_r} Lage${n_r > 1 ? "n" : ""})`]);
  const bv = z.hinweis(X(x_holz) - tA / 2, Y((y_tasche + y_ug) / 2), "Vergussfuge, Holzstirn", 20, bl.y1 + 40, "start", ["abgedichtet"]);
  // Tasche: Linie durch die Lücke zwischen Lagesicherung und Restquerschnitt
  z.hinweis(xTaPx, Y(y_tasche) - 6, "Tasche, bereichsweise ausgefräst,", Math.max(bv.x1 + 24, xTaPx - 4), bl.y1 + 40, "start", ["mit Aufbeton vergossen"]);
  z.text(X(x_tasche) + 20, Y(h_c) - 8, "Aufbeton", 14, "start", "text", false, { frei: true });
  let unten = bv.y1 + 18;
  const bm = z.massstabBalken(20, unten + 8, m, balkenLaenge(m));
  unten = Math.max(unten, bm.y1, br.y1);

  // ---------------- Text ----------------
  const T = 712;
  z.titel(T, 26, "Lastabtrag");
  const zeilen = [
    ["Decke nur einseitig:", true], ["Torsion dauerhaft"], [""],
    ["m_{T,Ed} = V_{Ed} · e", true, "kraft"], ["je m Trägerlänge"], [""],
    ["Kräftepaar:", true], ["D_{Ed} = Z_{Ed} = m_{T,Ed} / d", true, "kraft"],
    ["D: Druck im Aufbeton"], ["gegen den Trägersteg"], ["Z: Anschlussbewehrung,"], ["verankert im Taschenbeton"], ["je Tasche Z_{Ed} · a_{T}"], [""],
    ["Montagezustand:", true], ["noch kein Kräftepaar,"], ["Torsion über Träger zu den"], ["Stützen oder Abstützung"], [""],
    ["Aufbau (Maße in mm):", true], [`BSP ${fmt(h_h)} ${bspTyp(lagen, p.aufbau)}, ${p.klasse_bsp}`], [`Lagen ${lagen.map((v) => fmt(v)).join("-")}`],
    [`h_{c} = ${fmt(h_c)}, h_{F} = ${fmt(y_tasche - h_c)}, h_{R} = ${fmt(h_rest)}`],
    [`b_{A} = ${fmt(b_A)}, Ø${fmt(d_b)}, l = ${fmt(l_v)} (Annahmen)`],
    [`HBV: ${HBV[p.hbv].kurz},`], [`Paare e = ${fmt(p.hbv_e)}`],
    [`Maßstab 1 px = ${fmt(m)} mm`, false, "mass"],
  ];
  let y = 50;
  for (const [t, f, art] of zeilen) {
    if (t) { z.text(T, y, t, 14, "start", art || "text", !!f); y += 20; } else y += 8;
  }
  unten = Math.max(unten, y - 16);

  const legende = [["holz_hirn", "Holz, Hirnholz"], ["@spann", "BSP-Lage, Faser in Zeichenebene"], ["beton", "Beton"],
    ["schnitt", "Stahl"], ["schraube", "Bewehrung, Schrauben"], ["daemm", "Abdichtung"]];
  const yl = z.legende(legende, 20, unten + 16, 672);
  z.h = yl + 8;
  return z;
}

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
