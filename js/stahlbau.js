// stahlbau.js – überschlägige Bemessungswerte nach DIN EN 1993-1-8 (mit NA Deutschland: γM0 = 1,0,
// γM2 = 1,25). Alle Kräfte in kN, Längen in mm, Spannungen in N/mm².
// Vereinfachungen: Scherfuge im Gewinde (A_s), Lochleibung mit den ungünstigsten Beiwerten der
// Gruppe (Randschraube), Kehlnähte mit dem vereinfachten Verfahren (4.5.3.3).

export const GM0 = 1.0, GM2 = 1.25;

export const STAHL = {
  S235: { fy: 235, fu: 360, betaW: 0.8 },
  S355: { fy: 355, fu: 490, betaW: 0.9 },
};
export const STAHL_OPTIONEN = [{ wert: "S235", text: "S235" }, { wert: "S355", text: "S355" }];

// Schrauben: Nenndurchmesser, Lochdurchmesser (normales Lochspiel), Spannungsquerschnitt
export const SCHRAUBEN = {
  M12: { d: 12, d0: 13, As: 84.3 }, M16: { d: 16, d0: 18, As: 157 }, M20: { d: 20, d0: 22, As: 245 },
  M24: { d: 24, d0: 26, As: 353 }, M27: { d: 27, d0: 30, As: 459 }, M30: { d: 30, d0: 33, As: 561 },
};
export const schraubenOptionen = (liste) => liste.map((m) => ({ wert: m, text: `${m} (Loch ${SCHRAUBEN[m].d0} mm)` }));
export const FESTIGKEIT = { "8.8": { fub: 800, alphaV: 0.6 }, "10.9": { fub: 1000, alphaV: 0.5 } };
export const FESTIGKEIT_OPTIONEN = [{ wert: "8.8", text: "8.8" }, { wert: "10.9", text: "10.9" }];

export const EC3 = "DIN EN 1993-1-8";

// Abscheren je Scherfuge (Gewinde in der Scherfuge), Tab. 3.4
export function fvRd(m, kl) {
  const s = SCHRAUBEN[m], f = FESTIGKEIT[kl];
  return (f.alphaV * f.fub * s.As) / GM2 / 1000;
}

// Zug je Schraube, Tab. 3.4
export function ftRd(m, kl) {
  return (0.9 * FESTIGKEIT[kl].fub * SCHRAUBEN[m].As) / GM2 / 1000;
}

// Lochleibung je Schraube, Tab. 3.4. e1/p1 in Kraftrichtung, e2/p2 quer dazu (p2 = Infinity: eine Reihe)
export function fbRd(m, kl, t, fu, { e1, p1 = Infinity, e2, p2 = Infinity }) {
  const { d, d0 } = SCHRAUBEN[m], fub = FESTIGKEIT[kl].fub;
  const alphaD = Math.min(e1 / (3 * d0), p1 / (3 * d0) - 0.25);
  const alphaB = Math.max(0, Math.min(alphaD, fub / fu, 1));
  const k1 = Math.max(0, Math.min(2.8 * e2 / d0 - 1.7, 1.4 * p2 / d0 - 1.7, 2.5));
  return (k1 * alphaB * fu * d * t) / GM2 / 1000;
}

// Kehlnaht, vereinfachtes Verfahren: Tragfähigkeit je mm Nahtlänge in kN/mm
export function fwRd(a, stahl) {
  const s = STAHL[stahl];
  return (a * s.fu) / Math.sqrt(3) / (s.betaW * GM2) / 1000;
}

// Schub eines Blechs (Bruttoquerschnitt), DIN EN 1993-1-1, 6.2.6
export function vplRd(A, stahl) {
  return (A * STAHL[stahl].fy) / Math.sqrt(3) / GM0 / 1000;
}

// Runden auf 5 mm (für abgeleitete Maße)
export const auf5 = (v) => Math.ceil(v / 5 - 1e-9) * 5;

// Profilparameter (verborgen, aus der Profilwahl gefüllt) und Lesen der Werte
export const PROFIL_I = ["IPE", "HEA", "HEB", "HEM"];
export const profilMasse = (pre, gruppe) => ["h", "b", "tw", "tf", "r", "A"].map((k) => ({ key: `${pre}_${k}`, typ: "zahl", verborgen: true, standard: 0, gruppe }));
export const profilFuellt = (pre) => ({ h: `${pre}_h`, b: `${pre}_b`, tw: `${pre}_tw`, tf: `${pre}_tf`, r: `${pre}_r`, A: `${pre}_A` });
export const profilAus = (p, pre) => ({ h: p[`${pre}_h`], b: p[`${pre}_b`], tw: p[`${pre}_tw`], tf: p[`${pre}_tf`], r: p[`${pre}_r`], A: p[`${pre}_A`] * 100 });

// Plastisches Widerstandsmoment eines I-Profils (ohne Ausrundungen, auf der sicheren Seite)
export const wpl = (pr) => pr.b * pr.tf * (pr.h - pr.tf) + (pr.tw * (pr.h - 2 * pr.tf) ** 2) / 4;

export const E_STAHL = 210000;

// T-Stummel (DIN EN 1993-1-8, Tab. 6.2), Methode 1, ohne Futterplatten: Bemessungswert in kN.
// leff, tf, m, emin in mm; ftSumme: Summe der Schraubenzugkräfte F_t,Rd der Reihe in kN
export function tStummel(leff, tf, m, emin, fy, ftSumme) {
  if (!(m > 0)) return ftSumme;
  const mpl = (0.25 * leff * tf * tf * fy) / GM0 / 1000; // kN·mm
  const n = Math.min(emin, 1.25 * m);
  return Math.min((4 * mpl) / m, (2 * mpl + n * ftSumme) / (m + n), ftSumme);
}
