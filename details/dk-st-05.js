// DK-ST-05 HEB-Nebenträger an DELTABEAM-Randträger mit Fahnenblech
// Port von dk_st_05() (Detailkatalog Generator, 26.10.2026), parametrisch.
import { Zeichnung, massstab, waehleMassstab, fmt } from "../js/dk.js";
import {
  STAHL, STAHL_OPTIONEN, SCHRAUBEN as SCHR, schraubenOptionen, FESTIGKEIT_OPTIONEN, fvRd, fbRd, fwRd, vplRd,
  PROFIL_I, profilMasse, profilFuellt, reiheEinpassen, reiheMeldungen,
} from "../js/stahlbau.js";

export const meta = {
  id: "DK-ST-05",
  titel: "HEB-Nebenträger an DELTABEAM-Randträger mit Fahnenblech",
  kategorie: "Stahl-Anschlüsse",
  beschreibung:
    "HEB-Träger senkrecht an der senkrechten Stegseite eines DELTABEAM-Randträgers (DR), Oberkanten bündig, gelenkig: " +
    "Fahnenblech werkseitig an Steg und Untergurt geschweißt (analog Peikko-Seitenanschluss), HEB-Steg einschnittig " +
    "verschraubt. HEB-Ende vor dem Untergurtüberstand. Bleche des DELTABEAM schematisch; Anschluss am DELTABEAM " +
    "wird von Peikko geplant. Standard: DR32-365, HEB 320, 3 × M20. Schraubenzahl und Lochabstand passen sich dem " +
    "geraden Stegteil des Nebenträgers an, solange sie nicht vorgegeben sind.",
  nachweise: [
    "Schrauben: Abscheren und Lochleibung in Fahnenblech und HEB-Steg (Langlöcher für Toleranz berücksichtigen)",
    "Fahnenblech: V_{Ed} und M = V_{Ed} · e (Schweißnaht bis Schraubenreihe), Schub, Blockversagen; seitlicher Versatz e_{y} = (t_{p} + t_{w}) / 2",
    "Kehlnähte Fahnenblech an Steg und Untergurt: für volle Blechtragfähigkeit auslegen",
    "HEB-Steg: Blockversagen, Nettoquerschnitt am Trägerende",
    "DELTABEAM: Torsion T_{Ed} = V_{Ed} · e_{T} über den Kasten zu den Stützen, lokale Stegbiegung an der Anschlussstelle (Peikko)",
    "Montagezustand vor dem Verguss: Torsion ohne Mitwirkung des Betons, ggf. Abstützung",
    "Lage zu Stegöffnungen und Ringankerbewehrung, Verguss nicht behindern",
    "Brandschutz: Wärmeeintrag über den Anschluss in den DELTABEAM",
  ],
  vorschau: { x0: 0, x1: 672 }, // Ausschnitt für die Kachel (px)
  faustwerte: ["Schrauben Stahlbau", "Schweißnähte"],
};

export const parameter = [
  { key: "traeger", label: "Profil", typ: "profil", reihe: PROFIL_I, standard: "HEB 320", fuellt: profilFuellt("t"), gruppe: "Nebenträger" },
  ...profilMasse("t", "Nebenträger"),
  { key: "h_dr", label: "Höhe h", typ: "zahl", einheit: "mm", standard: 320, min: 200, max: 600, gruppe: "DELTABEAM DR" },
  { key: "B", label: "Untergurtbreite B", typ: "zahl", einheit: "mm", standard: 485, min: 300, max: 800, gruppe: "DELTABEAM DR" },
  { key: "b1", label: "Deckenauflager b_{1}", typ: "zahl", einheit: "mm", standard: 100, min: 60, max: 200, gruppe: "DELTABEAM DR", weitere: true },
  { key: "b2", label: "Obergurtbreite b_{2}", typ: "zahl", einheit: "mm", standard: 245, min: 120, max: 500, gruppe: "DELTABEAM DR", weitere: true },
  { key: "schraube", label: "Schrauben", typ: "auswahl", standard: "M20", optionen: schraubenOptionen(["M16", "M20", "M24"]), gruppe: "Anschluss" },
  { key: "n", label: "Anzahl n", typ: "zahl", einheit: "", standard: 0, min: 2, max: 6, auto: true, gruppe: "Anschluss", hilfe: "leer = automatisch (Schraubenbild ≥ 0,6 h)" },
  { key: "t_p", label: "Fahnenblech t_{p}", typ: "zahl", einheit: "mm", standard: 15, min: 8, max: 30, gruppe: "Anschluss" },
  { key: "p1", label: "Lochabstand p_{1}", typ: "zahl", einheit: "mm", standard: 0, min: 40, max: 150, auto: true, gruppe: "Anschluss", weitere: true, hilfe: "leer = automatisch (3 d₀, bei wenig Steghöhe kleiner)" },
  { key: "e2", label: "Randabstand e_{2}", typ: "zahl", einheit: "mm", standard: 50, min: 25, max: 100, gruppe: "Anschluss", weitere: true },
  { key: "fk", label: "Festigkeitsklasse", typ: "auswahl", standard: "8.8", optionen: FESTIGKEIT_OPTIONEN, gruppe: "Werkstoff", weitere: true },
  { key: "stahl", label: "Stahlsorte", typ: "auswahl", standard: "S355", optionen: STAHL_OPTIONEN, gruppe: "Werkstoff", weitere: true },
];

export const varianten = [
  { name: "heb200", roh: { traeger: "HEB 200", schraube: "M16", n: "2", p1: "60", e2: "35" } },
  { name: "dr50", roh: { h_dr: "500", B: "600", b2: "300", traeger: "HEB 500", n: "5", p1: "70", schraube: "M24", e2: "60" } },
  { name: "zuviele", roh: { n: "6", p1: "80" } },
  // Automatik: Schraubenbild folgt dem Nebenträger
  { name: "auto_heb240", roh: { traeger: "HEB 240" } },
  { name: "auto_ipe300", roh: { traeger: "IPE 300", schraube: "M16" } },
  { name: "auto_dr50", roh: { h_dr: "500", B: "600", b2: "300", traeger: "HEA 500" } },
  { name: "zu_hoch", roh: { traeger: "HEB 400" } }, // Träger höher als der DELTABEAM: die Prüfung zeigt es
];

export function zeichne(p, opt = {}) {
  const z = new Zeichnung(940, 500, {
    messe: opt.messe,
    felder: [{ name: "Schnitt", x0: 0, x1: 672 }, { name: "Text", x0: 712, x1: 940 }],
  });

  // ---------------- Abmessungen (mm), Ursprung: Außenkante Untergurt DR / OK ----------------
  const { h_dr: h, B, b1, b2, e2, t_p } = p;
  const h_t = p.t_h, tf = p.t_tf, r = p.t_r, tw = p.t_tw;
  const { d, d0 } = SCHR[p.schraube];
  const t_u = 20, t_o = 12, t_s = 12, t_w = 8; // Bleche DR schematisch
  const b = B - b1 - 20; // Kastenbreite unten (Peikko-Bezeichnung DRh-b)
  const x_ws = B - 20; // Außenfläche senkrechter Steg
  const x_top0 = x_ws - b2; // Beginn Obergurt
  const x_fuss = B - (20 + b); // Fuß geneigter Steg (= b1)
  const x_heb = B + 10, x_heb_ende = x_heb + Math.max(460, 1.4 * h_t);
  const x_sl = x_heb + e2, x_fb_ende = x_sl + e2;
  // Fahnenblech zwischen den Ausrundungen, Schrauben mittig
  const y_fb_o = tf + r + 5, y_fb_u = Math.min(h_t - tf - r - 5, h - t_u);
  const ym = (y_fb_o + y_fb_u) / 2;
  // Schraubenbild in die Blechhöhe einpassen (n, p1 automatisch, wenn nicht vorgegeben); das Blech nutzt
  // den ganzen geraden Stegteil, die Schrauben sitzen mittig
  const platz = Math.max(0, y_fb_u - y_fb_o);
  const R = reiheEinpassen({ m: p.schraube, platz, ziel: 0.6 * h_t, n: p.n, p1: p.p1, nMax: 6 });
  const { n, p1 } = R;
  if (R.nAuto) z.auto.n = n;
  if (R.pAuto) z.auto.p1 = p1;
  z.anpassungen.push(...reiheMeldungen(R, platz, "das Schraubenbild").filter((t) => !/Randabstand e_\{1\}/.test(t)));
  const reihen = Array.from({ length: n }, (_, i) => ym + (i - (n - 1) / 2) * p1);
  const e1o = reihen[0] - y_fb_o, e1u = y_fb_u - reihen[n - 1];

  // ---------------- Prüfungen ----------------
  const EC3 = "DIN EN 1993-1-8, Tab. 3.3";
  z.pruefe("Trägerhöhe ≤ DR-Höhe (Oberkanten bündig)", h - h_t, 0, "geometrisch");
  if (h_t > h) z.anpassungen.push(`Nicht lösbar: Nebenträger (h = ${fmt(h_t)} mm) höher als der DELTABEAM (h = ${fmt(h)} mm). Höheren DELTABEAM oder niedrigeren Träger wählen.`);
  z.pruefe("e_{1} oben Fahnenblech, Schrauben frei von Flansch und Ausrundung (≥ 1,2 d_{0})", e1o, 1.2 * d0, EC3);
  z.pruefe("e_{1} unten Fahnenblech, Schrauben frei von Flansch und Ausrundung (≥ 1,2 d_{0})", e1u, 1.2 * d0, EC3);
  if (n > 1) z.pruefe("p_{1} Lochabstand (≥ 2,2 d_{0})", p1, 2.2 * d0, EC3);
  z.pruefe("e_{2} Fahnenblech Ende (≥ 1,2 d_{0})", x_fb_ende - x_sl, 1.2 * d0, EC3);
  z.pruefe("e_{2} HEB-Steg Trägerende (≥ 1,2 d_{0})", x_sl - x_heb, 1.2 * d0, EC3);
  z.pruefe("Spalt HEB-Ende – Untergurtrand DR (≥ 10)", x_heb - B, 10, "konstruktiv");
  z.pruefe("Obergurt DR innerhalb Untergurt", x_top0 - x_fuss, 0, "geometrisch");

  // ---------------- Tragfähigkeit Anschluss (überschlägig, ohne DELTABEAM) ----------------
  const st = STAHL[p.stahl], M = p.schraube, G = "V_{Rd}", T34 = "DIN EN 1993-1-8, Tab. 3.4";
  const h_p = y_fb_u - y_fb_o, e = x_sl - x_ws;
  z.widerstand(G, `Schrauben, Abscheren (${n} × ${M} ${p.fk}, einschnittig)`, n * fvRd(M, p.fk), "kN", T34);
  z.widerstand(G, `Lochleibung Fahnenblech t = ${fmt(t_p)}`, n * fbRd(M, p.fk, t_p, st.fu, { e1: Math.min(e1o, e1u), p1, e2: x_fb_ende - x_sl }), "kN", T34);
  z.widerstand(G, `Lochleibung Steg ${p.traeger} t_{w} = ${fmt(tw)}`, n * fbRd(M, p.fk, tw, st.fu, { e1: 1e3, p1, e2: x_sl - x_heb }), "kN", T34);
  z.widerstand(G, "Fahnenblech, Schub (brutto)", vplRd(h_p * t_p, p.stahl), "kN", "DIN EN 1993-1-1, 6.2.6");
  z.widerstand(G, "Fahnenblech, Biegung M = V · e (elastisch)", ((t_p * h_p ** 2) / 6 * st.fy) / e / 1000, "kN", "DIN EN 1993-1-1, 6.2.5");
  const a = Math.ceil(0.5 * t_p);
  z.widerstand(G, `Kehlnähte am Steg 2 × a = ${fmt(a)} (V und V · e)`, fwRd(a, p.stahl) / Math.hypot(1 / (2 * h_p), (6 * e) / (2 * h_p ** 2)), "kN", "DIN EN 1993-1-8, 4.5.3.3");
  z.tragHinweise.push("Nur der Anschluss Fahnenblech/Nebenträger; DELTABEAM (Torsion T_{Ed} = V_{Ed} · e_{T}, Stegbiegung) bemisst Peikko",
    "Naht am Untergurt nicht angesetzt (auf der sicheren Seite); Blockversagen nicht enthalten");

  // ---------------- Maßstab ----------------
  const x0 = 70, y0 = 116;
  const m = waehleMassstab(Math.max(x_heb_ende / (600 - x0), h / 240), [1.5, 2, 2.5, 3, 4]);
  const D = massstab(x0, y0, m);
  const { X, Y } = D, P = D.px;

  z.titel(20, 26, "Ansicht HEB / Schnitt DELTABEAM");

  // HEB (Ansicht)
  z.rect(X(x_heb), Y(0), P(x_heb_ende - x_heb), P(h_t), "ansicht_hinten", 1.2);
  z.linie(X(x_heb), Y(tf), X(x_heb_ende), Y(tf), "text", 1.0);
  z.linie(X(x_heb), Y(h_t - tf), X(x_heb_ende), Y(h_t - tf), "text", 1.0);
  z.linie(X(x_heb_ende), Y(-10), X(x_heb_ende), Y(h_t + 10), "mass", 1.0, "6 3");
  // DELTABEAM DR (Schnitt)
  z.rect(X(0), Y(h - t_u), P(B), P(t_u), "schnitt", 1.0);
  z.rect(X(x_top0), Y(0), P(b2), P(t_o), "schnitt", 1.0);
  z.rect(X(x_ws - t_s), Y(t_o), P(t_s), P(h - t_u - t_o), "schnitt", 1.0);
  z.poly([[X(x_top0 + t_w), Y(t_o)], [X(x_top0), Y(t_o)], [X(x_fuss), Y(h - t_u)], [X(x_fuss + t_w), Y(h - t_u)]], "schnitt", 1.0);
  // Fahnenblech (Ansicht vorn), Kehlnähte
  const fb = [[x_ws, y_fb_o], [x_fb_ende, y_fb_o], [x_fb_ende, y_fb_u], [B, y_fb_u], [B, h - t_u], [x_ws, h - t_u]];
  if (y_fb_u >= h - t_u - 1) fb.splice(3, 2); // Blech reicht bis zum Untergurt: unten gerade
  z.poly(fb.map(([a, c]) => [X(a), Y(c)]), "ansicht_vorn", 1.2);
  z.linie(X(x_ws) + 1.5, Y(y_fb_o), X(x_ws) + 1.5, Y(h - t_u), "naht", 3.0);
  z.linie(X(x_ws), Y(h - t_u) - 1.5, X(B), Y(h - t_u) - 1.5, "naht", 3.0);
  for (const yr of reihen) z.schraubeAnsicht(X(x_sl), Y(yr), P(d) / 2);

  // Achse Kastenmitte, Kräfte
  const x_achse = (x_fuss + x_ws) / 2;
  z.linie(X(x_achse), Y(0) - 50, X(x_achse), Y(h) + 14, "achse", 1.0, "12 3 2 3");
  z.kraft(X(x_sl), Y(0) - 46, X(x_sl), Y(0) - 4, "V_{Ed}", X(x_sl) + 8, Y(0) - 28);
  z.massH([X(x_ws), X(x_sl)], Y(0) - 16, ["e"], [[X(x_ws), Y(0) - 4]]);
  z.massH([X(x_achse), X(x_sl)], Y(0) - 58, ["e_{T}"], [[X(x_achse), Y(0) - 52], [X(x_sl), Y(0) - 50]]);
  const cyT = Y(h * 0.55);
  z.moment(X(x_achse), cyT, 18, "T_{Ed}", X(x_achse) + 26, cyT + 6, true);

  // Maße Schraubenbild rechts des Fahnenblechs
  const xm = X(x_fb_ende) + 14;
  z.massV([Y(y_fb_o), ...reihen.map(Y), Y(y_fb_u)], xm,
    ["e_{1}", ...reihen.slice(1).map(() => "p_{1}"), "e_{1}"].map((l, i, a) => (P(i === 0 ? e1o : i === a.length - 1 ? e1u : p1) >= (i === 0 || i === a.length - 1 ? 20 : 17) ? l : "")),
    [[Y(y_fb_o), X(x_fb_ende)], [Y(y_fb_u), X(x_fb_ende)]]);
  // Maße unten: b1, e2, e2
  const yb = Y(Math.max(h, h_t)) + 22;
  z.massH([X(0), X(x_fuss)], yb, [[`b_{1} = ${fmt(b1)}`, "b_{1}"]], [[X(0), Y(h)], [X(x_fuss), Y(h)]]);
  z.massH([X(x_heb), X(x_sl), X(x_fb_ende)], yb, ["e_{2}", "e_{2}"], [[X(x_heb), Y(h_t)], [X(x_sl), Y(y_fb_u)], [X(x_fb_ende), Y(y_fb_u)]], { aussen: "rechts" });

  // Bezeichnungen
  const nameDR = `DELTABEAM DR${fmt(h / 10)}-${fmt(b)}`;
  const ry = yb + 48;
  const bd = z.hinweis(X(B * 0.4), Y(h) + 1, nameDR, 20, ry, "start", ["(Bleche schematisch)"]);
  const bf = z.hinweis(X(x_ws + 4), Y(y_fb_u) - 6, "Fahnenblech, werkseitig", Math.max(bd.x1 + 24, X(x_fuss) + 40), ry, "start", ["angeschweißt (Peikko),", `${n} × ${p.schraube}, einschnittig`]);
  z.hinweis(X(x_heb_ende) - 40, Y(h_t) + 1, p.traeger || `HEB ${fmt(h_t)}`, Math.max(bf.x1 + 24, X(x_heb_ende) - 90), ry);
  z.text(20, yb + 20, "Deckenauflager", 14, "start", "mass", false);
  const bm = z.massstabBalken(20, Math.max(bd.y1, bf.y1) + 22, m, balkenLaenge(m));

  // ---------------- Text ----------------
  const T = 712;
  z.titel(T, 26, "Nebenträgeranschluss");
  const zeilen = [
    ["Gelenkig, Fahnenblech am"], ["senkrechten Steg (wie Peikko)"], [""],
    ["Fahnenblech:", true], ["V_{Ed} und V_{Ed} · e"], [""],
    ["DELTABEAM:", true], ["T_{Ed} = V_{Ed} · e_{T}"], ["Torsion über Kasten zu den"], ["Stützen; Montagezustand!"], [""],
    ["HEB-Ende vor dem"], ["Untergurtüberstand (20)"], [""],
    [`DR${fmt(h / 10)}-${fmt(b)}: h = ${fmt(h)},`], [`B = ${fmt(B)}, b_{1} = ${fmt(b1)}`], [""],
    [`${n} × ${p.schraube}, d_{0} = ${fmt(d0)}`], [`e_{1} = ${fmt(Math.round(Math.min(e1o, e1u)))}, p_{1} = ${fmt(p1)}, e_{2} = ${fmt(e2)}`], [""],
    ["Planung durch Peikko", true],
    [`Maßstab 1 px = ${fmt(m)} mm`, false, "mass"],
  ];
  let y = 50;
  for (const [t, f, art] of zeilen) {
    if (t) { z.text(T, y, t, 14, "start", art || "text", !!f); y += 20; } else y += 8;
  }
  const unten = Math.max(bm.y1, y - 16);

  // Legende
  const yl = z.legende([["schnitt", "Stahl im Schnitt"], ["ansicht_vorn", "Ansicht"], ["naht", "Kehlnaht"]], 20, unten + 16, 672);
  z.h = yl + 8;
  return z;
}

function balkenLaenge(m) {
  for (const l of [20, 50, 100, 200, 250, 500, 1000, 2000]) if (l / m >= 40) return l;
  return 2000;
}
