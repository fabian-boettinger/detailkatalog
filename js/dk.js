// dk.js – Zeichenbausteine für den Detailkatalog (Port von dk.py, Stand inkl. Holzbau,
// Maßstab/Prüfung, stab_schraeg, Stile elastomer/daemm).
//
// Jedes Detail wird einmal beschrieben und als zwei SVG-Varianten ausgegeben:
//   farbe – Stil wie die Faustwert-Skizzen (Skill tragwerk-skizze)
//   sw    – schwarz-weiß, Schraffuren nach DIN ISO 128-50 / DIN 1356-1, Ansichten weiß
//
// Stile (Flächen) und ihre s/w-Darstellung:
//   schnitt          Stahl im Schnitt: enge 45°-Schraffur (Metall)
//   beton            Beton/Stahlbeton: 45°-Schraffur, durchgezogene und gestrichelte Linien im Wechsel
//   holz_hirn        Hirnholz (Faser senkrecht zur Zeichenebene): Jahresringe als Bögen, je Fläche erzeugt
//   holz_laengs      Vollholz/BSH längs zur Faser geschnitten, Faser waagerecht: wellige Faserlinien
//   holz_laengs_v    dasselbe, Faser senkrecht im Bild (holz = Kurzname dafür); nicht für BSP
//   holz_fsh         Furnierschichtholz/BauBuche im Querschnitt: feine Linien parallel zu den Furnieren
//   holz_fsh_v       dasselbe mit senkrechten Linien (z. B. BauBuche-Stütze längs geschnitten oder in Ansicht)
//   holz_leer        BSP-Lage mit Faser in der Zeichenebene: ohne Schraffur, Spannrichtungssymbol
//   daemm            weiche Dämmung, Trennlage: Schlaufen quer über die Dicke (< 6 px nur Kontur)
//   elastomer        elastisches Lager, Dichtung: voll schwarz (dünne Schicht)
//   naht             Schweißnaht im Schnitt: voll schwarz
//   schraube         Schraube, Bolzen: grau mit Kontur (Normteile werden nicht schraffiert)
//   schraube_hinten  Schraube hinter der Schnittebene: hellgrau mit Kontur
//   ansicht_*        Ansichten: weiß
// Holz- und Dämmschraffuren werden je Fläche erzeugt (js/schraffur.js), auf die Fläche
// zugeschnitten und mit festem Seed aus der Geometrie gezeichnet. Die Farbvariante zeigt dieselben
// Linien in Holz- bzw. Dämmfarbe; Beton und Stahl bleiben dort flächig.
// Texte mit Index: "V_{Ed}" wird zu V mit tiefgestelltem Ed.
//
// Unterschiede zu dk.py:
//   - Geometrie in mm, Maßstab je Feld (massstab(), waehleMassstab()); pruefe() nimmt mm statt px
//   - jedes Element kennt seine Umrandung (box) → pruefeLayout() meldet Überlappungen Text/Text,
//     Text auf Bauteil, Elemente außerhalb der Felder bzw. im Freistreifen, Schrift < 14
//   - hinweis(): Hinweislinie endet automatisch am Text; legende(): bricht selbst um

import { seedAus, hirnholz, laengsholz, furnier, daemmSchlaufen, spannSymbol } from "./schraffur.js";

export const BREITE = 940;

// Kennzeichnung nicht normativer Sollwerte in der Prüfliste
export const ANNAHME_ETA = "Annahme – maßgebend ETA";

export const STIL = {
  farbe: {
    ansicht_hinten: ["#e6ecf3", "#1f2937"],
    ansicht_vorn: ["#cfd9e5", "#1f2937"],
    schnitt: ["#9fb3c8", "#1f2937"],
    naht: ["#1f4e79", "#1f4e79"],
    schraube: ["#5b6875", "#1f2937"],
    beton: ["#dcdcd8", "#1f2937"],
    holz: ["#ead9bb", "#1f2937"],
    holz_laengs: ["#ead9bb", "#1f2937"],
    holz_laengs_v: ["#ead9bb", "#1f2937"],
    holz_hirn: ["#ead9bb", "#1f2937"],
    holz_fsh: ["#e8cdb0", "#1f2937"],
    holz_fsh_v: ["#e8cdb0", "#1f2937"],
    holz_leer: ["#ead9bb", "#1f2937"],
    elastomer: ["#e8a24a", "#1f2937"],
    daemm: ["#f5e6a8", "#1f2937"],
    schraube_hinten: ["#b4bcc4", "#5b6875"],
    holzlinie: "#b89a6a",
    daemmlinie: "#a8892e",
    kraft: "#c0392b",
    mass: "#5b6875",
    text: "#1f2937",
    titel: "#1f4e79",
    achse: "#1f4e79",
    hinweis: "#b26a00",
  },
  sw: {
    ansicht_hinten: ["#ffffff", "#000000"],
    ansicht_vorn: ["#ffffff", "#000000"],
    schnitt: ["url(#schraffur)", "#000000"],
    naht: ["#000000", "#000000"],
    schraube: ["#9a9a9a", "#000000"],
    beton: ["url(#beton)", "#000000"],
    holz: ["#ffffff", "#000000"],
    holz_laengs: ["#ffffff", "#000000"],
    holz_laengs_v: ["#ffffff", "#000000"],
    holz_hirn: ["#ffffff", "#000000"],
    holz_fsh: ["#ffffff", "#000000"],
    holz_fsh_v: ["#ffffff", "#000000"],
    holz_leer: ["#ffffff", "#000000"],
    elastomer: ["#000000", "#000000"],
    daemm: ["#ffffff", "#000000"],
    schraube_hinten: ["#e2e2e2", "#000000"],
    holzlinie: "#000000",
    daemmlinie: "#000000",
    kraft: "#000000",
    mass: "#000000",
    text: "#000000",
    titel: "#000000",
    achse: "#000000",
    hinweis: "#000000",
  },
};

// Flächen-Stile, auf denen kein Text liegen darf
const BAUTEIL = new Set(["ansicht_hinten", "ansicht_vorn", "schnitt", "naht", "schraube", "schraube_hinten", "beton",
  "holz", "holz_laengs", "holz_laengs_v", "holz_hirn", "holz_fsh", "holz_fsh_v", "holz_leer", "elastomer", "daemm"]);

// Stile mit je Fläche erzeugter Schraffur: Stil -> (x, y, w, h, seed) -> [Pfaddaten, Linienfarbe-Schlüssel]
const ERZEUGT = {
  holz_hirn: (x, y, w, h, s) => [hirnholz(x, y, w, h, s), "holzlinie"],
  holz_fsh: (x, y, w, h, s) => [furnier(x, y, w, h, s), "holzlinie"],
  holz_fsh_v: (x, y, w, h, s) => [furnier(x, y, w, h, s, true), "holzlinie"],
  holz_laengs: (x, y, w, h, s) => [laengsholz(x, y, w, h, s, false), "holzlinie"],
  holz_laengs_v: (x, y, w, h, s) => [laengsholz(x, y, w, h, s, true), "holzlinie"],
  holz: (x, y, w, h, s) => [laengsholz(x, y, w, h, s, true), "holzlinie"],
  daemm: (x, y, w, h) => [daemmSchlaufen(x, y, w, h), "daemmlinie"],
};

// Feldgrenzen (Skill tragwerk-skizze): Ansicht x ≤ 300, Schnitt x ≥ 370, Textfeld ab 712,
// dazwischen Streifen ohne jedes Element zum Ausschneiden.
export const FELDER_STANDARD = [
  { name: "Ansicht", x0: 0, x1: 300 },
  { name: "Schnitt", x0: 370, x1: 672 },
  { name: "Text", x0: 712, x1: 940 },
];

// „Glatte“ Maßstäbe in mm je px, aus denen waehleMassstab() den kleinsten passenden nimmt
export const MASSSTAEBE = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30];

// Faserrichtung der BSP-Lagen von oben: true = wie die Decklage. aufbau "doppelt": Längslagen
// paarweise (L L Q L L …, Typ „s“), nur wenn die Lagenzahl 3k + 2 ist; sonst abwechselnd.
export function laengsLagen(n, aufbau = "abwechselnd") {
  if (aufbau === "doppelt" && n % 3 === 2) return Array.from({ length: n }, (_, i) => i % 3 !== 2);
  return Array.from({ length: n }, (_, i) => i % 2 === 0);
}

// Typbezeichnung „L5“, „L8s“ (s = Längslagen doppelt)
export function bspTyp(lagen, aufbau = "abwechselnd") {
  return `L${lagen.length}${aufbau === "doppelt" && lagen.length % 3 === 2 ? "s" : ""}`;
}

export function waehleMassstab(bedarf, reihe = MASSSTAEBE) {
  for (const m of reihe) if (m >= bedarf - 1e-9) return m;
  return Math.ceil(bedarf);
}

// Zahl deutsch formatieren: fmt(1.75) -> "1,75", fmt(138.6, 0) -> "139"
export function fmt(v, nk = null) {
  if (nk === null) nk = Math.abs(v - Math.round(v)) < 1e-9 ? 0 : (Math.abs(v * 10 - Math.round(v * 10)) < 1e-9 ? 1 : 2);
  return v.toFixed(nk).replace(".", ",");
}

const r1 = (v) => Math.round(v * 10) / 10;
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// "V_{Ed}" -> [{t:"V", index:false}, {t:"Ed", index:true}]
export function textTeile(s) {
  const teile = String(s).split(/_\{([^}]*)\}/);
  return teile.map((t, i) => ({ t, index: i % 2 === 1 })).filter((x) => x.t !== "");
}

export function textMitIndex(s) {
  const teile = String(s).split(/_\{([^}]*)\}/);
  const out = [];
  teile.forEach((t, i) => {
    const e = esc(t);
    if (i % 2 === 0) {
      if (i > 0 && t) out.push(`<tspan dy="-3">${e}</tspan>`);
      else out.push(e);
    } else out.push(`<tspan font-size="0.75em" dy="3">${e}</tspan>`);
  });
  return out.join("");
}

// Laufweiten Arial (Einheiten je 1000), Ersatzschrift im Bild-Kontext (Lessons Learned)
const ARIAL = {
  " ": 278, "!": 278, '"': 355, "#": 556, $: 556, "%": 889, "&": 667, "'": 191, "(": 333, ")": 333, "*": 389, "+": 584,
  ",": 278, "-": 333, ".": 278, "/": 278, ":": 278, ";": 278, "<": 584, "=": 584, ">": 584, "?": 556, "@": 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722,
  O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611, "[": 278, "]": 278,
  _: 556, a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833,
  n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500, "|": 260,
  "ä": 556, "ö": 556, "ü": 556, "Ä": 667, "Ö": 778, "Ü": 722, "ß": 611, "Ø": 778, "ø": 611, "×": 584, "≈": 584,
  "≥": 549, "≤": 549, "∥": 400, "·": 278, "–": 556, "—": 1000, "°": 400, "⊥": 700, "σ": 600, "τ": 450, "√": 549,
};
for (const z of "0123456789") ARIAL[z] = 556;

// Schätzung der Textbreite in px (ohne Browser); app.js kann eine echte Messung übergeben
export function textBreiteSchaetzung(s, groesse = 14, fett = false) {
  let w = 0;
  for (const { t, index } of textTeile(s)) {
    let u = 0;
    for (const ch of t) u += ARIAL[ch] ?? 600;
    w += (u / 1000) * groesse * (index ? 0.75 : 1);
  }
  return w * (fett ? 1.08 : 1) * 1.03; // kleiner Zuschlag für Inter/DejaVu
}

export class Zeichnung {
  constructor(breite = BREITE, hoehe = 360, { mmProPx = null, felder = FELDER_STANDARD, messe = null } = {}) {
    this.b = breite;
    this.h = hoehe;
    this.el = []; // {f: (S)=>string, box:{x0,y0,x1,y1}|null, typ, art, s, opt}
    this.mmProPx = mmProPx; // Maßstab der maßstäblichen Teile (z. B. 2 = 1 px entspricht 2 mm)
    this.felder = felder;
    this.messe = messe || textBreiteSchaetzung;
    this.pruefungen = []; // {bez, ist, soll, ok, grundlage} in mm
    this.widerstaende = []; // {gruppe, bez, wert, einheit, grundlage} überschlägige Bemessungswerte
    this.tragHinweise = []; // Annahmen zur Tragfähigkeit (Texte)
    this.auto = {}; // key -> Wert: automatisch ermittelte Eingaben (Parameter mit auto: true und Wert 0)
    this.anpassungen = []; // Texte: was die Automatik an die Profile angepasst hat bzw. was nicht lösbar ist
    this.warnungen = []; // Layout-Hinweise der Bausteine selbst (z. B. Symbol entfällt)
    this.clipNr = 0; // fortlaufende Nummer für clipPath-IDs
  }

  _add(f, box, typ, art, extra = {}) {
    this.el.push({ f, box, typ, art, ...extra });
  }

  // --- Grundelemente -------------------------------------------------
  rect(x, y, w, h, art, swStroke = 1.2, opt = {}) {
    [x, y, w, h] = [r1(x), r1(y), r1(w), r1(h)];
    const box = { x0: x, y0: y, x1: x + w, y1: y + h };
    const erz = ERZEUGT[art] && w > 0 && h > 0 ? ERZEUGT[art](x, y, w, h, seedAus(art, x, y, w, h)) : null;
    if (!erz || !erz[0]) {
      this._add((S) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${S[art][0]}" stroke="${S[art][1]}" stroke-width="${swStroke}"/>`,
        box, "flaeche", art, { opt });
      return;
    }
    // Fläche, darin die erzeugte Schraffur auf die Fläche zugeschnitten, darüber die Kontur
    const [d, linie] = erz;
    const id = `k${++this.clipNr}`;
    const r = `x="${x}" y="${y}" width="${w}" height="${h}"`;
    this._add((S) => `<rect ${r} fill="${S[art][0]}"/><clipPath id="${id}"><rect ${r}/></clipPath>` +
      `<path d="${d}" fill="none" stroke="${S[linie]}" stroke-width="0.5" clip-path="url(#${id})"/>` +
      `<rect ${r} fill="none" stroke="${S[art][1]}" stroke-width="${swStroke}"/>`, box, "flaeche", art, { opt });
  }

  poly(pts, art, swStroke = 1.0, opt = {}) {
    const p = pts.map(([a, b]) => `${r1(a)},${r1(b)}`).join(" ");
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    this._add((S) => `<polygon points="${p}" fill="${S[art][0]}" stroke="${S[art][1]}" stroke-width="${swStroke}"/>`,
      { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }, "flaeche", art, { opt, pts });
  }

  kreis(cx, cy, r, art, swStroke = 1.0, opt = {}) {
    [cx, cy] = [r1(cx), r1(cy)];
    this._add((S) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${S[art][0]}" stroke="${S[art][1]}" stroke-width="${swStroke}"/>`,
      { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r }, "flaeche", art, { opt });
  }

  linie(x1, y1, x2, y2, art = "text", breite = 1.0, strich = null, marker = "", opt = {}) {
    [x1, y1, x2, y2] = [r1(x1), r1(y1), r1(x2), r1(y2)];
    const d = strich ? ` stroke-dasharray="${strich}"` : "";
    const b = breite / 2;
    this._add((S) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${typeof S[art] === "string" ? S[art] : S[art][1]}" stroke-width="${breite}"${d}${marker}/>`,
      { x0: Math.min(x1, x2) - b, y0: Math.min(y1, y2) - b, x1: Math.max(x1, x2) + b, y1: Math.max(y1, y2) + b }, "linie", art,
      { opt, seg: [x1, y1, x2, y2] });
  }

  // Umrandung eines Textes (für Layoutprüfung und Hinweislinien)
  textBox(x, y, s, groesse = 14, anker = "start", fett = false) {
    const w = this.messe(s, groesse, fett);
    const x0 = anker === "middle" ? x - w / 2 : anker === "end" ? x - w : x;
    const mitIndex = /_\{/.test(s);
    return { x0, y0: y - 0.74 * groesse, x1: x0 + w, y1: y + 0.22 * groesse + (mitIndex ? 3 : 0) };
  }

  // opt.legende: Legendentext (Schrift 13 erlaubt); opt.frei: darf auf Bauteil liegen
  text(x, y, s, groesse = 14, anker = "start", art = "text", fett = false, opt = {}) {
    [x, y] = [r1(x), r1(y)];
    const f = fett ? ' font-weight="bold"' : "";
    const inhalt = textMitIndex(s);
    const box = this.textBox(x, y, s, groesse, anker, fett);
    this._add((S) => `<text x="${x}" y="${y}" font-size="${groesse}" text-anchor="${anker}" fill="${S[art]}"${f}>${inhalt}</text>`,
      box, "text", art, { s, groesse, opt });
    return box;
  }

  titel(x, y, s) {
    return this.text(x, y, s, 16, "start", "titel", true);
  }

  // --- Fachbausteine -------------------------------------------------
  schraubeAnsicht(cx, cy, r = 9) {
    this.kreis(cx, cy, r, "schraube", 1);
    this.linie(cx - r - 4, cy, cx + r + 4, cy, "mass", 0.6);
    this.linie(cx, cy - r - 4, cx, cy + r + 4, "mass", 0.6);
  }

  // Schraube von der Seite: Schaft, Kopf, Mutter. Achse horizontal (achseY) oder vertikal (achseX).
  schraubeSeite({ achseX = null, achseY = null, von = 0, bis = 0, d = 10, kopf = [10, 22], mutter = [10, 22] } = {}) {
    const [kl, kb] = kopf, [ml, mb] = mutter;
    if (achseY !== null) {
      const y = achseY;
      this.rect(von, y - d / 2, bis - von, d, "schraube", 0.8);
      this.rect(bis, y - kb / 2, kl, kb, "schraube", 0.8);
      this.rect(von - ml, y - mb / 2, ml, mb, "schraube", 0.8);
    } else {
      const x = achseX;
      this.rect(x - d / 2, von, d, bis - von, "schraube", 0.8);
      this.rect(x - kb / 2, von - kl, kb, kl, "schraube", 0.8);
      this.rect(x - mb / 2, bis, mb, ml, "schraube", 0.8);
    }
  }

  // Schraube/Stab beliebiger Neigung als Rechteck der Breite dPx (maßstäblich)
  stabSchraeg(x1, y1, x2, y2, dPx, art = "schraube") {
    const L = Math.hypot(x2 - x1, y2 - y1);
    const nx = (-(y2 - y1) / L) * dPx / 2, ny = ((x2 - x1) / L) * dPx / 2;
    this.poly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]], art, 0.6);
  }

  kraft(x1, y1, x2, y2, label, lx, ly, anker = "start") {
    this.linie(x1, y1, x2, y2, "kraft", 2.4, null, ' marker-end="url(#pf-kraft)"');
    this.text(lx, ly, label, 16, anker, "kraft", true);
  }

  // Momentenpfeil als 3/4-Kreisbogen
  moment(cx, cy, r, label, lx, ly, uhrzeigersinn = true) {
    const rad = (g) => (g * Math.PI) / 180;
    const [a0, a1] = uhrzeigersinn ? [rad(200), rad(-60)] : [rad(-20), rad(240)];
    const x0 = cx + r * Math.cos(a0), y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
    const sweep = uhrzeigersinn ? 1 : 0;
    this._add((S) => `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 1 ${sweep} ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="${S.kraft}" stroke-width="2.4" marker-end="url(#pf-kraft)"/>`,
      { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r }, "linie", "kraft");
    this.text(lx, ly, label, 16, "start", "kraft", true);
  }

  // Horizontale Maßkette. punkte: x-Werte; hilfslinien: Map/Objekt x -> y_start der Hilfslinie
  // opt.aussen ("rechts" | "links"): passt eine Beschriftung nicht zwischen ihre Hilfslinien, stehen
  // alle Beschriftungen der Kette in ihrer Reihenfolge neben dem Kettenende (z. B. „e_{2,T} | e_{2}“);
  // opt.immer: immer dort (wenn z. B. eine Hinweislinie durch die Kette läuft).
  // Rückgabe: Umrandung dieses Textes oder null.
  massH(punkte, y, labels, hilfslinien = null, opt = {}) {
    for (const [x, ys] of eintraege(hilfslinien)) this.linie(x, ys, x, y + 5, "mass", 0.7);
    const eng = opt.aussen && (opt.immer || labels.some((l, i) => typeof l === "string" && l && this.messe(l, 14) > Math.abs(punkte[i + 1] - punkte[i]) - 4));
    for (let i = 0; i + 1 < punkte.length; i++) {
      const a = punkte[i], b = punkte[i + 1];
      this.linie(a, y, b, y, "mass", 0.8, null, ' marker-start="url(#pf-mass)" marker-end="url(#pf-mass)"');
      if (eng) continue;
      const lab = this.passend(labels[i], Math.abs(b - a) - 4); // Text zwischen den Hilfslinien
      if (lab) this.text((a + b) / 2, y - (/_\{/.test(lab) ? 8 : 5), lab, 14, "middle"); // Index hält Abstand zur Maßlinie
    }
    if (!eng) return null;
    const s = labels.map((l) => (Array.isArray(l) ? l[0] : l)).filter(Boolean).join(" | ");
    return opt.aussen === "links" ? this.text(Math.min(...punkte) - 8, y + 5, s, 14, "end") : this.text(Math.max(...punkte) + 8, y + 5, s, 14, "start");
  }

  // Aus Alternativen [lang, kurz, …] die erste wählen, die in breite px passt (sonst die letzte)
  passend(alternativen, breite, groesse = 14, fett = false) {
    if (!Array.isArray(alternativen)) return alternativen;
    for (const a of alternativen) if (this.messe(a, groesse, fett) <= breite) return a;
    return alternativen[alternativen.length - 1];
  }

  // opt.frei: Maßtexte dürfen auf Bauteilen stehen (z. B. Hebelarm im Querschnitt)
  massV(punkte, x, labels, hilfslinien = null, seite = "rechts", opt = {}) {
    for (const [y, xs] of eintraege(hilfslinien)) this.linie(xs, y, x + (seite === "rechts" ? 5 : -5), y, "mass", 0.7);
    for (let i = 0; i + 1 < punkte.length; i++) {
      const a = punkte[i], b = punkte[i + 1];
      this.linie(x, a, x, b, "mass", 0.8, null, ' marker-start="url(#pf-mass)" marker-end="url(#pf-mass)"');
      if (labels[i]) {
        if (seite === "rechts") this.text(x + 6, (a + b) / 2 + 5, labels[i], 14, "start", "text", false, opt);
        else this.text(x - 6, (a + b) / 2 + 5, labels[i], 14, "end", "text", false, opt);
      }
    }
  }

  schnittlinie(x1, y1, x2, y2, buchstabe) {
    this.linie(x1, y1, x2, y2, "text", 0.9, "12 3 2 3");
    if (Math.abs(y2 - y1) < Math.abs(x2 - x1)) {
      this.text(x1, y1 - 6, buchstabe, 15, "start", "text", true);
      this.text(x2, y2 - 6, buchstabe, 15, "end", "text", true);
    } else {
      this.text(x1 + 6, y1 + 4, buchstabe, 15, "start", "text", true);
      this.text(x2 + 6, y2, buchstabe, 15, "start", "text", true);
    }
  }

  scherfuge(x1, y1, x2, y2) {
    this.linie(x1, y1, x2, y2, "achse", 2.0, "6 3");
  }

  // Hinweislinie mit frei gesetztem Endpunkt (wie dk.py)
  zeiger(x1, y1, x2, y2, label, lx, ly, anker = "start") {
    this.linie(x1, y1, x2, y2, "text", 0.8);
    return this.text(lx, ly, label, 14, anker);
  }

  // Hinweis: Text an (lx, ly), Linie vom Ziel (zx, zy) bis an den Rand des Textes (Abstand 3 px)
  hinweis(zx, zy, label, lx, ly, anker = "start", zeilen = []) {
    const n0 = this.el.length;
    const box = this.text(lx, ly, label, 14, anker);
    let b = { ...box };
    zeilen.forEach((t, i) => {
      const bi = this.text(lx, ly + 18 * (i + 1), t, 14, anker);
      b = { x0: Math.min(b.x0, bi.x0), y0: b.y0, x1: Math.max(b.x1, bi.x1), y1: bi.y1 };
    });
    const g = { x0: b.x0 - 3, y0: b.y0 - 3, x1: b.x1 + 3, y1: b.y1 + 3 };
    const ex = Math.min(Math.max(zx, g.x0), g.x1), ey = Math.min(Math.max(zy, g.y0), g.y1);
    const eigene = this.el.slice(n0);
    this.linie(zx, zy, ex, ey, "text", 0.8, null, "", { hinweis: true, eigene });
    return b;
  }

  // Spannrichtungssymbol (BSP-Lage mit Faser in der Zeichenebene): Linie, links Haken nach oben,
  // rechts Haken nach unten; senkrecht für stehende Platten
  spann(cx, cy, laenge, senkrecht = false) {
    const d = spannSymbol(cx, cy, laenge, senkrecht);
    const k = Math.min(6, laenge / 4) * 0.7;
    const box = senkrecht ? { x0: cx - k, y0: cy - laenge / 2, x1: cx + k, y1: cy + laenge / 2 }
      : { x0: cx - laenge / 2, y0: cy - k, x1: cx + laenge / 2, y1: cy + k };
    this._add((S) => `<path d="${d}" fill="none" stroke="${S.text}" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/>`,
      box, "symbol", "text");
  }

  // Brettsperrholz im Schnitt. Lagen von oben (liegend) bzw. von links (stehend), Dicken in px.
  // decklage: Faser der Decklagen zur Schnittebene, 0 = in der Zeichenebene, 90 = senkrecht dazu.
  // Lagen mit Faser senkrecht zur Zeichenebene: Hirnholz (je Lamelle, wenn lamellePx gesetzt).
  // Lagen mit Faser in der Zeichenebene: keine Schraffur, Spannrichtungssymbol mittig im freien
  // Bereich der Lage (60 % davon, max. 60 px, min. 12 px); Lagen unter 8 px Dicke ohne Symbol.
  // frei(i, a, b): freier Bereich der Lage i entlang der Platte als [a, b] in px, null = kein Symbol.
  // laengs: optional je Lage true/false (Faserrichtung wie die Decklage), sonst abwechselnd
  bsp(x, y, laenge, lagenPx, decklage, { stehend = false, frei = null, lamellePx = null, laengs: lr = null } = {}) {
    let pos = stehend ? x : y;
    const a0 = stehend ? y : x, a1 = a0 + laenge;
    lagenPx.forEach((t, i) => {
      const laengs = lr ? lr[i] : i % 2 === 0;
      const inEbene = laengs ? decklage === 0 : decklage === 90;
      const flaeche = (a, b, stil) => (stehend ? this.rect(pos, a, t, b - a, stil, 0.5) : this.rect(a, pos, b - a, t, stil, 0.5));
      if (inEbene) {
        flaeche(a0, a1, "holz_leer");
        const f = frei ? frei(i, a0, a1) : [a0, a1];
        if (f && t >= 8) {
          const L = Math.min(60, 0.6 * (f[1] - f[0]));
          if (L >= 12) {
            const m = (f[0] + f[1]) / 2;
            if (stehend) this.spann(pos + t / 2, m, L, true);
            else this.spann(m, pos + t / 2, L);
          }
        }
      } else {
        // Hirnholz je Lamelle (gleich breite Lamellen, die letzte angeschnitten)
        const lb = lamellePx && lamellePx > 4 ? lamellePx : laenge;
        for (let a = a0; a < a1 - 0.5; a += lb) flaeche(a, Math.min(a + lb, a1), "holz_hirn");
      }
      pos += t;
    });
    const dicke = lagenPx.reduce((a, b) => a + b, 0);
    if (stehend) this.kontur(x, y, dicke, laenge);
    else this.kontur(x, y, laenge, dicke);
  }

  // I-Profil im Querschnitt mit Ausrundungen. (cx, cy) Mitte in px, pr = {h, b, tw, tf, r} in mm,
  // P: mm -> px. liegend: Steg waagerecht (Flansche senkrecht), z. B. Stütze im Horizontalschnitt.
  iProfil(cx, cy, pr, P, art = "schnitt", { liegend = false } = {}) {
    const { h, b, tw, tf } = pr, r = pr.r || 0;
    const pts = [];
    const bogen = (mx, my, a0, a1) => { for (let i = 0; i <= 6; i++) { const a = a0 + ((a1 - a0) * i) / 6; pts.push([mx + r * Math.cos(a), my + r * Math.sin(a)]); } };
    const H = h / 2, B = b / 2, T = tw / 2, PI = Math.PI;
    pts.push([-B, -H], [B, -H], [B, -H + tf]);
    if (r > 0) bogen(T + r, -H + tf + r, -PI / 2, -PI); else pts.push([T, -H + tf]);
    if (r > 0) bogen(T + r, H - tf - r, PI, PI / 2); else pts.push([T, H - tf]);
    pts.push([B, H - tf], [B, H], [-B, H], [-B, H - tf]);
    if (r > 0) bogen(-T - r, H - tf - r, PI / 2, 0); else pts.push([-T, H - tf]);
    if (r > 0) bogen(-T - r, -H + tf + r, 0, -PI / 2); else pts.push([-T, -H + tf]);
    pts.push([-B, -H + tf]);
    this.poly(pts.map(([x, y]) => (liegend ? [cx + P(y), cy + P(x)] : [cx + P(x), cy + P(y)])), art, 1.0);
  }

  // Ende eines liegenden I-Profils im Querschnitt (Steg waagerecht): Flansch rechts mit Außenfläche
  // bei xAussen (px), Achse cy (px), sichtbar sind laengeMm ab der Außenfläche; links abgeschnitten.
  // Für tiefe Stützen, von denen nur der Anschlussbereich gezeigt wird.
  iProfilEnde(xAussen, cy, pr, P, laengeMm, art = "schnitt") {
    const { b, tw, tf } = pr, r = pr.r || 0, L = laengeMm;
    const pts = [[0, -b / 2], [0, b / 2], [-tf, b / 2]];
    const bogen = (mx, my, a0, a1) => { for (let i = 0; i <= 6; i++) { const a = a0 + ((a1 - a0) * i) / 6; pts.push([mx + r * Math.cos(a), my + r * Math.sin(a)]); } };
    if (r > 0) bogen(-tf - r, tw / 2 + r, 0, -Math.PI / 2); else pts.push([-tf, tw / 2]);
    pts.push([-L, tw / 2], [-L, -tw / 2]);
    if (r > 0) bogen(-tf - r, -tw / 2 - r, Math.PI / 2, 0); else pts.push([-tf, -tw / 2]);
    pts.push([-tf, -b / 2]);
    this.poly(pts.map(([x, y]) => [xAussen + P(x), cy + P(y)]), art, 1.0);
  }

  // I-Profil in Ansicht auf den Steg: Rechteck mit Flansch- und Ausrundungslinien.
  // waagerecht (Träger): x, y = linke obere Ecke, laenge in px; senkrecht (Stütze): Profilhöhe waagerecht.
  // teil (mm, nur senkrecht): nur der rechte Teil dieser Breite mit dem rechten Flansch (x = linker Rand des Teils).
  iAnsicht(x, y, laengePx, pr, P, { senkrecht = false, art = "ansicht_hinten", teil = null } = {}) {
    const H = P(pr.h), tf = P(pr.tf), tr = P(pr.tf + (pr.r || 0));
    if (senkrecht && teil !== null && teil < pr.h - 1e-9) {
      const B = P(teil);
      this.rect(x, y, B, laengePx, art, 1.2);
      this.linie(x + B - tf, y, x + B - tf, y + laengePx, "text", 0.9);
      if (tr - tf > 1.5) this.linie(x + B - tr, y, x + B - tr, y + laengePx, "text", 0.4);
      return;
    }
    if (!senkrecht) {
      this.rect(x, y, laengePx, H, art, 1.2);
      for (const yy of [tf, H - tf]) this.linie(x, y + yy, x + laengePx, y + yy, "text", 0.9);
      if (tr - tf > 1.5) for (const yy of [tr, H - tr]) this.linie(x, y + yy, x + laengePx, y + yy, "text", 0.4);
    } else {
      this.rect(x, y, H, laengePx, art, 1.2);
      for (const xx of [tf, H - tf]) this.linie(x + xx, y, x + xx, y + laengePx, "text", 0.9);
      if (tr - tf > 1.5) for (const xx of [tr, H - tr]) this.linie(x + xx, y, x + xx, y + laengePx, "text", 0.4);
    }
  }

  // Umriss ohne Füllung
  kontur(x, y, w, h, breite = 1.0) {
    [x, y, w, h] = [r1(x), r1(y), r1(w), r1(h)];
    this._add((S) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${S.text}" stroke-width="${breite}"/>`,
      { x0: x, y0: y, x1: x + w, y1: y + h }, "kontur", "text");
  }

  // Detailrahmen gestrichelt
  rahmen(x, y, w, h) {
    [x, y, w, h] = [r1(x), r1(y), r1(w), r1(h)];
    this._add((S) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${S.mass}" stroke-width="0.8" stroke-dasharray="3 2"/>`,
      { x0: x, y0: y, x1: x + w, y1: y + h }, "linie", "mass",
      { segs: [[x, y, x + w, y], [x + w, y, x + w, y + h], [x, y + h, x + w, y + h], [x, y, x, y + h]] });
  }

  // Maßstabsbalken: Länge laengeMm, geteilt in zwei Hälften, Beschriftung darunter
  massstabBalken(x, y, mmProPx, laengeMm) {
    const L = laengeMm / mmProPx;
    this._add((S) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(L / 2)}" height="4" fill="${S.mass}" stroke="${S.mass}" stroke-width="0.6"/>`,
      { x0: x, y0: y, x1: x + L / 2, y1: y + 4 }, "linie", "mass");
    this._add((S) => `<rect x="${r1(x + L / 2)}" y="${r1(y)}" width="${r1(L / 2)}" height="4" fill="#ffffff" stroke="${S.mass}" stroke-width="0.6"/>`,
      { x0: x + L / 2, y0: y, x1: x + L, y1: y + 4 }, "linie", "mass");
    return this.text(x + L + 6, y + 6, `${fmt(laengeMm)} mm`, 14, "start", "mass");
  }

  // Legende: eintraege [[art, text], ...], fließt von links nach rechts, bricht vor xMax um.
  // Eintrag [stil, text] zeigt ein Flächenmuster (Holz/Dämmung als größeres Muster 22 × 12),
  // ["@spann", text] das Spannrichtungssymbol. Gibt die Grundlinie der letzten Zeile zurück.
  legende(eintraege, x, yOben, xMax) {
    if (this.legendeAb === undefined) this.legendeAb = this.el.length; // Vorschau lässt die Legende weg
    let cx = x, y = yOben + 10;
    for (const [art, s] of eintraege) {
      const gross = art === "@spann" || ERZEUGT[art];
      const sym = gross ? 22 : 14;
      const w = sym + 6 + this.messe(s, 13, false);
      if (cx > x && cx + w > xMax) { cx = x; y += 22; }
      if (art === "@spann") this.spann(cx + 11, y - 5, 20);
      else if (gross) this.rect(cx, y - 11, 22, 12, art, 0.8, { legende: true });
      else this.rect(cx, y - 10, 14, 10, art, 0.8, { legende: true });
      this.text(cx + sym + 6, y, s, 13, "start", "text", false, { legende: true });
      cx += w + 18;
    }
    return y;
  }

  // --- Maßstab und Abstandsprüfung -------------------------------------
  px(mm) {
    return mm / this.mmProPx;
  }

  // Mindestabstand prüfen: ist und soll in mm (dk.py: ist in px).
  // grundlage: Herkunft des Sollwerts, z. B. "DIN EN 1995-1-1, Tab. 8.6" oder ANNAHME_ETA
  pruefe(bezeichnung, istMm, sollMm, grundlage = "") {
    this.pruefungen.push({ bez: bezeichnung, ist: r1(istMm), soll: r1(sollMm), ok: istMm >= sollMm - 0.05, grundlage });
  }

  // Überschlägiger Bemessungswert einer Komponente. Je gruppe (z. B. "V_{Rd}") ist der kleinste Wert
  // maßgebend. grundlage: Norm/Abschnitt oder „Annahme …“.
  widerstand(gruppe, bez, wert, einheit = "kN", grundlage = "") {
    if (Number.isFinite(wert)) this.widerstaende.push({ gruppe, bez, wert, einheit, grundlage });
  }

  // Maßgebende Werte je Gruppe: [{gruppe, wert, einheit, bez}]
  tragfaehigkeit() {
    const m = new Map();
    for (const w of this.widerstaende) if (!m.has(w.gruppe) || w.wert < m.get(w.gruppe).wert) m.set(w.gruppe, w);
    return [...m.values()];
  }

  pruefbericht() {
    const zeilen = this.pruefungen.map((p) => `${p.ok ? "ok  " : "NEIN"} ${p.bez}: ist ${p.ist} mm, soll >= ${p.soll} mm${p.grundlage ? ` [${p.grundlage}]` : ""}`);
    return { text: zeilen.join("\n"), fehler: this.pruefungen.filter((p) => !p.ok).map((p) => p.bez) };
  }

  // --- Layoutprüfung --------------------------------------------------
  pruefeLayout() {
    const w = [...this.warnungen];
    const tol = 0.5;
    const schnitt = (a, b) => a.x0 < b.x1 - tol && b.x0 < a.x1 - tol && a.y0 < b.y1 - tol && b.y0 < a.y1 - tol;
    const kurz = (e) => (e.typ === "text" ? `„${e.s.replace(/_\{([^}]*)\}/g, "$1")}“` : `${e.typ} (${e.art})`);
    const el = this.el.filter((e) => e.box);
    const texte = el.filter((e) => e.typ === "text");

    for (const e of el) {
      const b = e.box;
      if (b.x0 < -tol || b.x1 > this.b + tol || b.y0 < -tol || b.y1 > this.h + tol)
        w.push({ art: "Rand", text: `${kurz(e)} ragt über den Bildrand` });
      const feld = this.felder.find((f) => b.x0 >= f.x0 - tol && b.x1 <= f.x1 + tol);
      if (!feld) w.push({ art: "Feldgrenze", text: `${kurz(e)} liegt nicht vollständig in einem Feld (x ${Math.round(b.x0)}–${Math.round(b.x1)})` });
    }
    for (const t of texte) {
      if (t.groesse < 14 && !t.opt.legende) w.push({ art: "Schrift", text: `${kurz(t)}: Schrift ${t.groesse} < 14` });
    }
    for (let i = 0; i < texte.length; i++)
      for (let j = i + 1; j < texte.length; j++)
        if (schnitt(texte[i].box, texte[j].box)) w.push({ art: "Text/Text", text: `${kurz(texte[i])} überlappt ${kurz(texte[j])}` });
    for (const t of texte) {
      // Kraftbeschriftungen gehören zum Kraftsymbol und dürfen im Bauteil stehen
      if (t.opt.frei || t.opt.legende || t.art === "kraft") continue;
      for (const f of el) {
        // Ansichtsflächen sind Zeichengrund (Maße und Texte dürfen darauf stehen)
        if (f.typ !== "flaeche" || !BAUTEIL.has(f.art) || f.art.startsWith("ansicht") || (f.opt && f.opt.legende)) continue;
        if (schnitt(t.box, f.box)) { w.push({ art: "Text/Bauteil", text: `${kurz(t)} liegt auf ${f.art}` }); break; }
      }
    }
    // Symbole nicht auf Text, Maßketten oder Hinweislinien
    for (const sy of el.filter((e) => e.typ === "symbol")) {
      for (const t of texte) if (schnitt(sy.box, t.box)) w.push({ art: "Symbol", text: `Spannrichtungssymbol liegt auf ${kurz(t)}` });
      for (const l of el.filter((e) => (e.seg || e.segs) && (e.art === "mass" || (e.opt && e.opt.hinweis))))
        if ((l.segs || [l.seg]).some((sg) => strecheTrifftBox(sg, sy.box))) w.push({ art: "Symbol", text: `Spannrichtungssymbol kreuzt ${l.opt && l.opt.hinweis ? "Hinweislinie" : "Maßlinie"}` });
    }
    for (const l of el.filter((e) => e.seg || e.segs)) {
      const segs = l.segs || [l.seg];
      const hinweis = l.opt && l.opt.hinweis;
      for (const t of texte) {
        if (hinweis && l.opt.eigene.includes(t)) continue;
        const innen = { x0: t.box.x0 + 1, y0: t.box.y0 + 1, x1: t.box.x1 - 1, y1: t.box.y1 - 1 };
        if (segs.some((sg) => strecheTrifftBox(sg, innen)))
          w.push({ art: hinweis ? "Hinweislinie" : "Linie/Text", text: `${hinweis ? "Hinweislinie" : `Linie (${l.art})`} kreuzt ${kurz(t)}` });
      }
    }
    return w;
  }

  // --- Ausgabe -------------------------------------------------------
  svg(modus = "farbe") {
    const S = STIL[modus];
    const defs = `<defs>
<marker id="pf-kraft" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${S.kraft}"/></marker>
<marker id="pf-mass" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${S.mass}"/></marker>
<pattern id="schraffur" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><rect width="4" height="4" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="4" stroke="#000000" stroke-width="0.8"/></pattern>
<pattern id="beton" patternUnits="userSpaceOnUse" width="12" height="14" patternTransform="rotate(45)"><rect width="12" height="14" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="14" stroke="#000000" stroke-width="0.6"/><line x1="6" y1="0.5" x2="6" y2="14" stroke="#000000" stroke-width="0.6" stroke-dasharray="4 3"/></pattern>
</defs>`;
    const h = Math.ceil(this.h);
    const kopf = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.b} ${h}" width="${this.b}" height="${h}" font-family="Inter, DejaVu Sans, Arial, sans-serif" font-size="15">`;
    const koerper = this.el.map((e) => e.f(S)).join("\n");
    return `${kopf}\n${defs}\n<rect width="${this.b}" height="${h}" fill="#ffffff"/>\n${koerper}\n</svg>\n`;
  }
}

// Vorschau für die Kachelübersicht: nur Bauteile (ohne Texte, Maße, Hinweislinien, Legende),
// beschnitten auf den Bereich ber = {x0, x1, y0, y1} (px), z. B. das Feld der Hauptansicht.
Zeichnung.prototype.vorschau = function (modus = "farbe", ber = {}) {
  const { x0 = 0, x1 = this.b, y0 = 0, y1 = this.h } = ber;
  const tol = 1;
  const el = this.el.filter((e, i) => !(this.legendeAb !== undefined && i >= this.legendeAb) && e.box && e.typ !== "text" && e.art !== "mass" && !(e.opt && (e.opt.hinweis || e.opt.legende)) &&
    e.box.x0 >= x0 - tol && e.box.x1 <= x1 + tol && e.box.y0 >= y0 - tol && e.box.y1 <= y1 + tol);
  if (!el.length) return this.svg(modus);
  const bx0 = Math.min(...el.map((e) => e.box.x0)) - 8, bx1 = Math.max(...el.map((e) => e.box.x1)) + 8;
  const by0 = Math.min(...el.map((e) => e.box.y0)) - 8, by1 = Math.max(...el.map((e) => e.box.y1)) + 8;
  const S = STIL[modus], w = Math.round(bx1 - bx0), h = Math.round(by1 - by0);
  const voll = this.svg(modus);
  const defs = voll.slice(voll.indexOf("<defs>"), voll.indexOf("</defs>") + 7);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${Math.round(bx0)} ${Math.round(by0)} ${w} ${h}" width="${w}" height="${h}">\n${defs}\n` +
    `<rect x="${Math.round(bx0)}" y="${Math.round(by0)}" width="${w}" height="${h}" fill="#ffffff"/>\n${el.map((e) => e.f(S)).join("\n")}\n</svg>\n`;
};

// Strecke [x1,y1,x2,y2] schneidet Rechteck? (Liang-Barsky)
function strecheTrifftBox([x1, y1, x2, y2], b) {
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  for (const [p, q] of [[-dx, x1 - b.x0], [dx, b.x1 - x1], [-dy, y1 - b.y0], [dy, b.y1 - y1]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
    else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t0 < t1;
}

function eintraege(h) {
  if (!h) return [];
  if (h instanceof Map) return [...h.entries()];
  if (Array.isArray(h)) return h;
  return Object.entries(h).map(([k, v]) => [Number(k), v]);
}

// Hilfsobjekt für ein maßstäbliches Feld: Ursprung (x0, y0) in px, Maßstab m in mm/px.
// X(mm), Y(mm) rechnen Modellkoordinaten (mm) in Zeichnungskoordinaten (px) um.
export function massstab(x0, y0, m) {
  return { m, X: (x) => x0 + x / m, Y: (y) => y0 + y / m, px: (mm) => mm / m };
}
