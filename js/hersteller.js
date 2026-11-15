// hersteller.js – Kennwerte aus Europäischen Technischen Bewertungen (ETA) für die Herstellerauswahl.
// Kräfte in kN, Längen in mm. Die Werte sind aus den ETA-Fassungen unten abgeschrieben; vor einer
// Verwendung in einer prüffähigen Statik mit der gültigen ETA abgleichen.
//
// Würth ETA-11/0190 vom 22.01.2026: Tab. A.2.1/A.2.2 (M_y,k, f_tens,k „ASSY plus VG“), Tab. A.2.4 (f_ax,k),
//   Gl. (2.12)/(2.13) (k_ax), FSH/GLVL nach ETA-14/0354: f_ax,k = 35 N/mm² bei ρ_a = 730.
//   Tab. A.2.4 nennt für „ASSY 4 VG“ höhere f_ax,k (d 8: 12,0); ob das die ASSY plus VG ist, geht aus der
//   ETA nicht eindeutig hervor – angesetzt sind wie im Bemessungstool die Werte „Andere Schrauben“.
// Rothoblaas ETA-11/0030 vom 20.08.2025: f_tens,k und M_y,k (VGZ/VGS, Kohlenstoffstahl), f_ax,k = 11,7 N/mm²
//   (ρ_k ≤ 440, ρ_a = 350), vorgebohrtes FSH nach ETA-14/0354: 29 N/mm² (ρ_a = 730), k_ax ab 45° = 1,0.
// Stora Enso CLT ETA-14/0349 vom 13.04.2026: ρ_k = 385 (1,1 · ρ_l,k), f_c,90,k = 2,5 (C24),
//   Rollschub f_v,9090,k = min(1,25; 1,45 – t_Q/100) für Fichte, f_v,090,k = 4,0.

import { HOLZ, KMOD, faxRk, bemessung, EC5 } from "./holzbau.js";
import { fmt } from "./dk.js";

export const SCHRAUBEN_HERSTELLER = {
  norm: { text: "allgemein (DIN EN 1995-1-1)", kurz: "ohne ETA", quelle: "DIN EN 1995-1-1, 8.7.2 (ohne ETA)" },
  assy: {
    text: "Würth ASSY plus VG (ETA-11/0190)", kurz: "Würth ASSY plus VG", quelle: "ETA-11/0190 (Würth), Anhang A.2",
    kaxAb: 30, faxFsh: 35, rhoMax: 590,
    d: { 6: { My: 9.0, ft: 11.5, fax: 11.5 }, 8: { My: 23.0, ft: 22.0, fax: 11.0 }, 10: { My: 40.0, ft: 33.0, fax: 11.0 },
         12: { My: 62.0, ft: 47.0, fax: 10.0 }, 14: { My: 86.0, ft: 62.0, fax: 10.0 } },
  },
  vgz: {
    text: "Rothoblaas VGZ (ETA-11/0030)", kurz: "Rothoblaas VGZ", quelle: "ETA-11/0030 (Rothoblaas), 3.4",
    kaxAb: 45, faxFsh: 29, rhoMax: 440,
    d: { 7: { My: 14.2, ft: 15.4, fax: 11.7 }, 9: { My: 27.2, ft: 25.4, fax: 11.7 }, 11: { My: 45.9, ft: 38.0, fax: 11.7 },
         13: { My: 70.9, ft: 53.0, fax: 11.7 } },
  },
  vgs: {
    text: "Rothoblaas VGS (ETA-11/0030)", kurz: "Rothoblaas VGS", quelle: "ETA-11/0030 (Rothoblaas), 3.4",
    kaxAb: 45, faxFsh: 29, rhoMax: 440,
    d: { 9: { My: 27.2, ft: 25.4, fax: 11.7 }, 11: { My: 45.9, ft: 38.0, fax: 11.7 }, 13: { My: 70.9, ft: 53.0, fax: 11.7 } },
  },
};
export const SCHRAUBEN_OPTIONEN = Object.entries(SCHRAUBEN_HERSTELLER).map(([wert, h]) => ({ wert, text: h.text }));

// BSP: Rohdichte und Festigkeiten je Hersteller (allgemein = Lamellenwerte nach DIN EN 338)
export const BSP_HERSTELLER = {
  allgemein: { text: "allgemein (Lamellen nach DIN EN 338)", quelle: "DIN EN 338, Annahme" },
  storaenso: { text: "Stora Enso CLT (ETA-14/0349)", quelle: "ETA-14/0349 (Stora Enso), Anhang 3", rho: 385, fv: 4.0 },
};
export const BSP_OPTIONEN = Object.entries(BSP_HERSTELLER).map(([wert, h]) => ({ wert, text: h.text }));

// Kennwerte des BSP: rho (für Ausziehen), fc90, Rollschub fr (größte Querlagendicke tQ), fv
export function bspKennwerte(hersteller, klasse, tQ = 40) {
  const h = BSP_HERSTELLER[hersteller] || BSP_HERSTELLER.allgemein;
  const l = HOLZ[klasse];
  const fr = Math.min(1.25, 1.45 - tQ / 100);
  if (hersteller === "storaenso") return { rho: h.rho, fc90: l.fc90, fr, fv: h.fv, quelle: h.quelle };
  return { rho: l.rho, fc90: l.fc90, fr: 1.0, fv: 4.0, quelle: "DIN EN 338 / DIN EN 1995-1-1 NA, Annahme" };
}

// Ausziehtragfähigkeit einer Schraube, charakteristisch [kN]
//   art: "nadel" (VH, BSH, BSP-Lagen) oder "fsh" (BauBuche/FSH nach ETA-14/0354, vorgebohrt)
//   rho: charakteristische Rohdichte des Bauteils; alpha: Winkel Schraubenachse – Faser [°]
// Liefert {Rk, quelle, hinweis} oder null, wenn der Hersteller d nicht führt (dann Normwert verwenden).
export function faxRkEta(hersteller, d, lef, art, rho, alpha) {
  const h = SCHRAUBEN_HERSTELLER[hersteller];
  if (!h || !h.d) return null;
  const k = h.d[d];
  if (!k) return null;
  const kax = alpha >= h.kaxAb ? 1 : 0.3 + (0.7 * alpha) / h.kaxAb;
  const [fax, rhoA] = art === "fsh" ? [h.faxFsh, 730] : [k.fax, 350];
  const hinweis = art === "fsh" ? "FSH vorgebohrt" : rho > h.rhoMax ? `ρ_{k} > ${h.rhoMax}: außerhalb der ETA` : "";
  return { Rk: (kax * fax * d * Math.max(lef, 0) * (rho / rhoA) ** 0.8) / 1000, quelle: h.quelle, hinweis };
}

// Zugtragfähigkeit f_tens,k [kN] oder null
export function ftensEta(hersteller, d) {
  const h = SCHRAUBEN_HERSTELLER[hersteller];
  return h && h.d && h.d[d] ? h.d[d].ft : null;
}

// Durchmesser, die ein Hersteller führt (für Hinweise)
export const durchmesser = (hersteller) => Object.keys((SCHRAUBEN_HERSTELLER[hersteller] || {}).d || {}).map(Number);

// Hinweis, wenn der gewählte Hersteller den Durchmesser nicht führt (dann rechnen die Details mit Normwerten)
export function sortimentHinweis(hersteller, d) {
  const h = SCHRAUBEN_HERSTELLER[hersteller];
  if (!h || !h.d || h.d[d]) return null;
  return `${h.kurz} gibt es nicht mit d = ${d} mm (nur ${durchmesser(hersteller).join(" / ")}); Herausziehen nach ${EC5} ohne ETA gerechnet`;
}

// Lasteinwirkungsdauer für die Auswahl (k_mod für NKL 1/2)
export const KLED_OPTIONEN = [
  { wert: "staendig", text: "ständig (kmod = 0,6)" }, { wert: "lang", text: "lang (kmod = 0,7)" },
  { wert: "mittel", text: "mittel (kmod = 0,8)" }, { wert: "kurz", text: "kurz (kmod = 0,9)" },
];
export const kmodText = (kled) => String(KMOD[kled]).replace(".", ",");

// Ausziehen je Schraube, Bemessungswert [kN] mit Grundlage: ETA des Herstellers, sonst DIN EN 1995-1-1, 8.7.2
//   rho: Rohdichte des Bauteils (BSP: nach BSP-Hersteller), alpha: Winkel Schraubenachse – Faser [°]
export function axRd(hersteller, d, lef, klasse, alpha, kmod, rho = HOLZ[klasse].rho) {
  const e = faxRkEta(hersteller, d, lef, HOLZ[klasse].art, rho, alpha);
  if (e) return { Rd: bemessung(e.Rk, kmod), quelle: e.quelle + (e.hinweis ? ` – ${e.hinweis}` : "") };
  return { Rd: bemessung(faxRk(d, lef, klasse, alpha), kmod), quelle: `${EC5}, 8.7.2 (ohne ETA)` };
}

// Zugtragfähigkeit der Schraube F_t,Rd = f_tens,k / γ_M2 [kN] oder null (ohne ETA unbekannt)
export const GM2_SCHRAUBE = 1.25;
export function ftRdEta(hersteller, d) {
  const ft = ftensEta(hersteller, d);
  return ft === null ? null : { Rd: ft / GM2_SCHRAUBE, quelle: `${SCHRAUBEN_HERSTELLER[hersteller].quelle}, f_{tens,k} = ${String(ft).replace(".", ",")} kN, γ_{M2} = 1,25` };
}

// ---------------------------------------------------------------------------------------------
// HBV-Verbinder (Holz-Beton-Verbund), Kennwerte je Schraubenpaar
// SFS VB-48-7,5 nach ETA-13/0699 vom 01.06.2022, Anhang 2 Tab. A.2.1 (Abstände), Anhang 5:
//   Paar ±45° (gekreuzt): F_Rk = k_α · min{F_ax,α,Rk; 13 000 N}, k_α = 1,414 (Tab. A.5.3),
//   F_ax,α,Rk = 90 · ℓ_ef · (ρ_k/350)^0,8 [N] in Nadelholz; K_ser = 240 · ℓ_ef [N/mm] je Paar (Tab. A.5.2).
// Rothoblaas CTC nach ETA-19/0244 vom 20.05.2019, Annex 1 Tab. 1.1 (Abstände), Annex 2:
//   je Schraube 45° geneigt, ohne Trittschall-Zwischenlage (Tab. 2.4):
//   F_Rk = (cos α + μ sin α) · min{F_ax,α,Rk; f_tens,k; F_ax,concrete,Rk}, μ = 0,25, F_ax,concrete,Rk = 15 kN,
//   F_ax,α,Rk = k_ax · 11,3 · d · ℓ_ef · (ρ_k/350)^0,8, k_ax = 1 (45°); K_ser = 48/56/60 · ℓ_ef je Schraube (Tab. 2.2).
//   „Paar“ = zwei geneigte Schrauben nebeneinander, Werte = 2 × je Schraube.
// ℓ_ef = Einschraubtiefe im Holz; aus der Schraubenlänge nach Anhang 3 der ETA (Zeichnung) ermitteln.
export const HBV = {
  sfs: { text: "SFS VB-48-7,5 (ETA-13/0699)", kurz: "SFS VB", quelle: "ETA-13/0699, Anhang 5",
    abst: { a1: 80, a2: 20, a3: 80, a4: 30 }, quelleAbst: "ETA-13/0699, Anhang 2, Tab. A.2.1" },
  ctc: { text: "Rothoblaas CTC (ETA-19/0244)", kurz: "Rothoblaas CTC", quelle: "ETA-19/0244, Annex 2, Tab. 2.2–2.4",
    d: { 7: { ft: 20, k: 48, a2: 35, a1cg: 85, a2cg: 32 }, 8: { ft: 25, k: 56, a2: 40, a1cg: 85, a2cg: 35 }, 9: { ft: 30, k: 60, a2: 45, a1cg: 85, a2cg: 37 } },
    quelleAbst: "ETA-19/0244, Annex 1, Tab. 1.1" },
};
export const HBV_OPTIONEN = Object.entries(HBV).map(([wert, h]) => ({ wert, text: h.text }));
export const HBV_D_OPTIONEN = [7, 8, 9].map((d) => ({ wert: d, text: `d = ${d} mm (nur CTC)` }));

// Tragfähigkeit und Verschiebungsmodul je Paar: {FRk [kN], FRd [kN], Kser [kN/mm], text, quelle}
export function hbvPaar(typ, d, lef, rho, kmod) {
  const r = (rho / 350) ** 0.8;
  if (typ === "ctc") {
    const k = HBV.ctc.d[d] || HBV.ctc.d[8];
    const Fax = 11.3 * d * lef * r;
    const a = Math.PI / 4, mu = 0.25;
    const F1 = (Math.cos(a) + mu * Math.sin(a)) * Math.min(Fax, k.ft * 1000, 15000);
    const FRk = (2 * F1) / 1000;
    return { FRk, FRd: bemessung(FRk, kmod), Kser: (2 * k.k * lef) / 1000,
      text: `2 × CTC Ø${d} 45°, ℓ_{ef} = ${Math.round(lef)} mm, μ = 0,25`, quelle: HBV.ctc.quelle };
  }
  const Fax = 90 * lef * r;
  const FRk = (1.414 * Math.min(Fax, 13000)) / 1000;
  return { FRk, FRd: bemessung(FRk, kmod), Kser: (240 * lef) / 1000,
    text: `SFS VB ±45°, ℓ_{ef} = ${Math.round(lef)} mm`, quelle: `${HBV.sfs.quelle}, Tab. A.5.2/A.5.3` };
}

// Mindestabstände [mm]: a1 (Paare in Faserrichtung), a2 (quer), a3 (Hirnholzende)
export function hbvAbstaende(typ, d) {
  if (typ === "ctc") { const k = HBV.ctc.d[d] || HBV.ctc.d[8]; return { a1: 130 * Math.sin(Math.PI / 4), a2: k.a2, a3: k.a1cg, quelle: HBV.ctc.quelleAbst }; }
  return { a1: HBV.sfs.abst.a1, a2: HBV.sfs.abst.a2, a3: HBV.sfs.abst.a3, quelle: HBV.sfs.quelleAbst };
}

// Gemeinsame Felder für DK-HO-03 und -04
export const hbvParameter = (gruppe, e_std) => [
  { key: "hbv", label: "HBV-Verbinder", typ: "auswahl", standard: "sfs", optionen: HBV_OPTIONEN, gruppe },
  { key: "hbv_d", label: "Durchmesser CTC", typ: "auswahl", standard: 8, optionen: HBV_D_OPTIONEN, gruppe, weitere: true },
  { key: "hbv_lef", label: "Einschraubtiefe ℓ_{ef} im Holz", typ: "zahl", einheit: "mm", standard: 100, min: 40, max: 200, gruppe, weitere: true,
    hilfe: "aus der Schraubenlänge nach Anhang 3 der ETA" },
  { key: "hbv_e", label: "Paarabstand e in Spannrichtung", typ: "zahl", einheit: "mm", standard: e_std, min: 60, max: 600, gruppe, weitere: true },
  { key: "hbv_n", label: "Paare je m Plattenbreite", typ: "zahl", einheit: "", standard: 4, min: 1, max: 20, gruppe, weitere: true },
];

// Widerstände, Prüfungen und Hinweise des HBV-Verbunds in die Zeichnung schreiben
//   h_holz: Holzdicke, h_c: Aufbeton, rho: Rohdichte Holz, a3ist: vorhandener Hirnholzabstand (oder null)
export function hbvNachweise(z, p, { h_holz, h_c, rho, a3ist = null }) {
  const kmod = KMOD[p.kled];
  const d = Number(p.hbv_d);
  const r = hbvPaar(p.hbv, d, p.hbv_lef, rho, kmod);
  const ab = hbvAbstaende(p.hbv, d);
  const n = Math.round(p.hbv_n);
  z.pruefe("HBV: Paarabstand in Spannrichtung a_{1}", p.hbv_e, ab.a1, ab.quelle);
  z.pruefe("HBV: Abstand quer a_{2} (1000 / Paare je m)", 1000 / n, ab.a2, ab.quelle);
  if (a3ist !== null) z.pruefe("HBV: Abstand zum Hirnholzende a_{3}", a3ist, ab.a3, ab.quelle);
  const q = p.hbv === "ctc" ? "ETA-19/0244, 1" : "ETA-13/0699, 1";
  z.pruefe("HBV: Aufbeton h_{c} ≥ 50", h_c, 50, q);
  z.pruefe("HBV: Holzdicke ≥ 100", h_holz, 100, q);
  z.pruefe("HBV: Aufbeton ≤ 70 % der Holzdicke", 0.7 * h_holz - h_c, 0, q);
  z.widerstand("F_{v,Rd} HBV-Paar", `${r.text}, k_{mod} = ${kmodText(p.kled)}`, r.FRd, "kN", r.quelle);
  z.widerstand("t_{Rd} Fuge", `Schubfluss je m Breite: ${n} Paare/m, e = ${p.hbv_e} mm`, (r.FRd * n * 1000) / p.hbv_e, "kN/m²", "aus F_{v,Rd}");
  z.widerstand("K_{ser} je Paar", "Verschiebungsmodul t = 0 (für t = ∞ mit k_{def} abmindern)", r.Kser, "kN/mm",
    p.hbv === "ctc" ? "ETA-19/0244, Tab. 2.2 (ohne Zwischenlage)" : "ETA-13/0699, Tab. A.5.2");
  z.tragHinweise.push(
    `HBV ${HBV[p.hbv].kurz}: F_{Rk} = ${fmt1(r.FRk)} kN je Paar; ℓ_{ef} nach Anhang 3 der ETA aus der Schraubenlänge prüfen`,
    "Schub im Holz in der Schraubenumrissfläche (Z-9.1-342) nicht enthalten – Zulassung liegt nicht vor",
  );
}
const fmt1 = (v) => String(Math.round(v * 10) / 10).replace(".", ",");

// Punkte für „Im Projekt zusätzlich nötig“ bei HBV-Decken (aus ETA-13/0699 Anhang 5 und ETA-19/0244 Annex 2)
export const HBV_NACHWEISE = [
  "HBV-Decke nachgiebig verbunden nach DIN EN 1995-1-1, Anhang B (γ-Verfahren) oder Stabwerk, linear-elastisch, mit Mittelwerten der E- und Verschiebungsmoduln (ETA-13/0699 bzw. ETA-19/0244)",
  "Grenzzustände für t = 0 und t = ∞: Kriechen, Schwinden des Betons, Feuchteänderung; k_{def} Verbindung NKL 1 / 2 = 0,6 / 4,0, BSP 0,8 / 2,0, Beton 2,5",
  "Schubtragfähigkeit des Holzes im Umkreis der Schrauben (Schraubenumrissfläche nach Z-9.1-342) und Tragfähigkeit der Betonplatte",
  "Nur Nutzungsklasse 1 und 2, vorwiegend ruhende Last; Beton ≥ C20/25; CTC: Reibung μ = 0,25 nur ohne Trittschall-Zwischenlage und bei geneigten, nicht gekreuzten Schrauben",
];
