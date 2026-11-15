// holzbau.js – überschlägige Bemessungswerte nach DIN EN 1995-1-1 mit NA Deutschland (γM = 1,3).
// Kräfte in kN, Längen in mm, Festigkeiten in N/mm². BauBuche GL75 nach ETA-14/0354 vom 16.04.2026
// (Anhang 2, Tab. 3, Werte für NKL 2, k_c,0 = 1); Schrauben ohne ETA nach DIN EN 1995-1-1, 8.7.2.

export const GM_HOLZ = 1.3;
export const KMOD = { staendig: 0.6, lang: 0.7, mittel: 0.8, kurz: 0.9 }; // NKL 1/2, Vollholz/BSH/BSP/FSH

// Rohdichte ρ_k [kg/m³], Druck parallel f_c,0,k und quer f_c,90,k [N/mm²]
const W = (rho, fc0, fc90, art = "nadel") => ({ rho, fc0, fc90, art });
export const HOLZ = {
  C16: W(310, 17, 2.2), C24: W(350, 21, 2.5), C30: W(380, 24, 2.7),
  GL24c: W(365, 21.5, 2.5), GL24h: W(385, 24, 2.5), GL28c: W(390, 24, 2.5), GL28h: W(425, 28, 2.5),
  GL30c: W(390, 24.5, 2.5), GL30h: W(430, 30, 2.5), GL32c: W(400, 24.5, 2.5), GL32h: W(440, 32, 2.5),
  GL75: W(730, 49.5, 12.3, "fsh"), // BauBuche: ETA-14/0354, Anh. 2 Tab. 3 (NKL 2; NKL 1: 59,4 / 14,8)
};
export const ETA_BAUBUCHE = "ETA-14/0354 vom 16.04.2026";
export const holzQuelle = (kl) => (HOLZ[kl] && HOLZ[kl].art === "fsh" ? `${ETA_BAUBUCHE}, Anhang 2, Tab. 3 (NKL 2)` : /^C/.test(kl) ? "DIN EN 338" : "DIN EN 14080");

// Lochleibungsfestigkeit f_h,α,k für Stabdübel/Bolzen (8.24, 8.31), α in Grad
export function fhAlpha(d, kl, alphaGrad) {
  const h = HOLZ[kl];
  const fh0 = 0.082 * (1 - 0.01 * d) * h.rho;
  const k90 = (h.art === "fsh" ? 1.3 : 1.35) + 0.015 * d;
  const a = (alphaGrad * Math.PI) / 180;
  return fh0 / (k90 * Math.sin(a) ** 2 + Math.cos(a) ** 2);
}

// BauBuche: Lochleibung stiftförmiger Verbindungsmittel nach DIN EN 1995-1-1, in den Schmalflächen für
// d ≥ 8 mm × 0,8; in Stirnflächen nicht zulässig (ETA-14/0354 vom 16.04.2026, Anhang 3 „Verbindungsmittel“, S. 17)
export const BAUBUCHE_FH_QUELLE = `${ETA_BAUBUCHE}, Anhang 3 „Verbindungsmittel“ (S. 17)`;
export function fhBauBuche(d, alphaGrad, schmalflaeche) {
  return fhAlpha(d, "GL75", alphaGrad) * (schmalflaeche && d >= 8 ? 0.8 : 1);
}

// Fließmoment Stabdübel M_y,Rk [Nmm] (8.30), f_u,k z. B. 360 (S235)
export const myRk = (d, fuk = 360) => 0.3 * fuk * d ** 2.6;

// Stahlblech innenliegend (Schlitzblech), je Scherfuge, charakteristisch [kN] (8.13 f, g, h), ohne Seilwirkung
export function fvRkSchlitzblech(fh, t1, d, My) {
  const f = fh * t1 * d;
  const g = fh * t1 * d * (Math.sqrt(2 + (4 * My) / (fh * d * t1 * t1)) - 1);
  const h = 2.3 * Math.sqrt(My * fh * d);
  return Math.min(f, g, h) / 1000;
}

// Selbstbohrende Schraube auf Herausziehen ohne ETA (8.38, 8.39), charakteristisch [kN];
// alpha: Winkel Schraubenachse – Faser in Grad, lef wirksame Gewindelänge
export function faxRk(d, lef, kl, alphaGrad) {
  const h = HOLZ[kl];
  const fax = 0.52 * d ** -0.5 * lef ** -0.1 * Math.min(h.rho, 500) ** 0.8;
  const kd = Math.min(d / 8, 1);
  const a = (alphaGrad * Math.PI) / 180;
  return (fax * d * Math.max(lef, 0) * kd) / (1.2 * Math.cos(a) ** 2 + Math.sin(a) ** 2) / 1000;
}

export const bemessung = (Rk, kmod) => (kmod * Rk) / GM_HOLZ;
export const EC5 = "DIN EN 1995-1-1";
