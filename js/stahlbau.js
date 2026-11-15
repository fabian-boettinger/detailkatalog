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

// Schrauben: Nenndurchmesser, Lochdurchmesser (normales Lochspiel), Spannungsquerschnitt,
// dU = Außendurchmesser der Scheibe (DIN EN ISO 7089) für die Kollisionsprüfung mit Ausrundung und Naht
export const SCHRAUBEN = {
  M12: { d: 12, d0: 13, As: 84.3, dU: 24 }, M16: { d: 16, d0: 18, As: 157, dU: 30 }, M20: { d: 20, d0: 22, As: 245, dU: 37 },
  M24: { d: 24, d0: 26, As: 353, dU: 44 }, M27: { d: 27, d0: 30, As: 459, dU: 50 }, M30: { d: 30, d0: 33, As: 561, dU: 56 },
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

// ---------------------------------------------------------------------------------------------
// Automatische Anpassung der Anschlussgeometrie an die gewählten Profile.
// Vorgaben mit Wert 0 gelten als „automatisch“; eingegebene Werte bleiben unverändert und werden nur geprüft.

// Schraubenreihe in Kraftrichtung (n Schrauben, Abstand p1, Rand e1) in die Höhe platz einpassen.
// ziel: angestrebte Mindesthöhe des Blechs (z. B. 0,6 h für die Verdrehhalterung des Trägers).
// Reihenfolge: n aus ziel, dann p1 von 3 d0 bis 2,2 d0 verkleinern, dann e1 von 1,8 d0 bis 1,2 d0,
// zuletzt n verringern. passt = false: auch mit den Mindestabständen nach Tab. 3.3 kein Platz.
export function reiheEinpassen({ m, platz, ziel = 0, n = 0, p1 = 0, nMin = 2, nMax = 8 }) {
  const { d0 } = SCHRAUBEN[m];
  const p1Std = auf5(3 * d0), p1Min = auf5(2.2 * d0), e1Std = auf5(1.8 * d0), e1Min = auf5(1.2 * d0);
  const hoehe = (k, p, e) => (k - 1) * p + 2 * e;
  const nAuto = !(n > 0), pAuto = !(p1 > 0);
  let k = nAuto ? nMin : Math.round(n);
  if (nAuto) while (k < nMax && hoehe(k, pAuto ? p1Std : p1, e1Std) < ziel - 1e-9) k++;
  const versuch = (k) => {
    const ps = [];
    if (pAuto) for (let p = p1Std; p >= p1Min; p -= 5) ps.push(p); else ps.push(p1);
    for (const p of ps) if (hoehe(k, p, e1Std) <= platz + 1e-9) return { p1: p, e1: e1Std };
    const pk = ps[ps.length - 1];
    for (let e = e1Std - 5; e >= e1Min; e -= 5) if (hoehe(k, pk, e) <= platz + 1e-9) return { p1: pk, e1: e };
    return null;
  };
  let r = versuch(k);
  while (!r && nAuto && k > nMin) r = versuch(--k);
  const passt = !!r;
  if (!r) r = { p1: pAuto ? p1Min : p1, e1: e1Min };
  return { n: k, p1: r.p1, e1: r.e1, h: hoehe(k, r.p1, r.e1), passt, nAuto, pAuto, p1Std, e1Std };
}

// Meldungen zu reiheEinpassen() für z.anpassungen. blech mit Artikel: z. B. "das Fahnenblech", platz wie oben
export function reiheMeldungen(R, platz, blech) {
  const t = [], z = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
  if (!R.passt) {
    t.push(`Nicht lösbar: ${blech.replace(/^\S+\s/, "")} mit ${R.n} Schrauben braucht mindestens ${z(R.h)} mm, der gerade Stegteil hat ${z(platz)} mm. ` +
      (R.nAuto && R.pAuto ? "Kleinere Schraube oder höheren Träger wählen." : "Anzahl und Lochabstand auf „automatisch“ stellen (Feld leeren) oder kleinere Schraube wählen."));
    return t;
  }
  if (R.pAuto && R.p1 < R.p1Std) t.push(`Lochabstand p_{1} von ${z(R.p1Std)} auf ${z(R.p1)} mm verkleinert, damit ${blech} in den geraden Stegteil (${z(platz)} mm) passt.`);
  if (R.e1 < R.e1Std) t.push(`Randabstand e_{1} von ${z(R.e1Std)} auf ${z(R.e1)} mm verkleinert (Mindestwert 1,2 d_{0} eingehalten).`);
  return t;
}

// Wurzelmaß w zweier Schraubenreihen beidseits eines Stegs. Untere Grenzen: Scheibe frei neben
// Steg + Kehlnaht des angeschweißten Trägers (wT) und frei neben Steg + Ausrundung der Stütze (wS),
// p2 ≥ 2,4 d0. Obere Grenze: Randabstand 1,2 d0 im Flansch der Breite bMax.
// w > 0: Vorgabe, wird nur geprüft. Rückgabe {w, wMinT, wMinS, wMax, passt, auto}.
export function wurzelmass({ m, w = 0, twT = 0, nahtT = 0, S = null, bMax = Infinity }) {
  const { d, d0, dU } = SCHRAUBEN[m];
  const wMinT = twT + 2 * nahtT * Math.SQRT2 + 2 * d; // wie Prüfung „Schraube neben der Naht“
  const wMinS = S ? S.tw + 2 * S.r + dU : 0;
  const wMin = Math.max(wMinT, wMinS, 2.4 * d0);
  const wMax = bMax - 2 * 1.2 * d0;
  const auto = !(w > 0);
  if (!auto) return { w, wMinT, wMinS, wMax, passt: w >= wMin - 0.05 && w <= wMax + 0.05, auto };
  // bevorzugt mit 10 mm Luft je Seite neben der Naht, auf 5 mm gerundet; sonst das Mindestmaß
  const kandidaten = [auf5(Math.max(wMinT + 20, wMinS, 2.4 * d0)), auf5(wMin), Math.ceil(wMin - 1e-9), Math.ceil(wMin * 10 - 1e-9) / 10];
  const wahl = kandidaten.find((x) => x <= wMax + 0.05);
  return { w: wahl ?? kandidaten[2], wMinT, wMinS, wMax, passt: wahl !== undefined, auto };
}

// Meldungen zu wurzelmass() für z.anpassungen
export function wurzelMeldungen(W, m) {
  const z = (v) => String(Math.round(v * 10) / 10).replace(".", ","), { d0 } = SCHRAUBEN[m];
  const wMin = Math.max(W.wMinT, W.wMinS, 2.4 * d0);
  if (!W.passt) {
    const unten = `mindestens ${z(wMin)} mm (${W.wMinS >= W.wMinT ? "Scheibe frei neben Steg und Ausrundung der Stütze" : "Schraube frei neben Steg und Naht des Trägers"})`;
    if (wMin > W.wMax + 0.05) return [`Nicht lösbar: Wurzelmaß w braucht ${unten}, der Stützenflansch lässt mit dem Randabstand 1,2 d_{0} ` +
      `${W.wMax > 0 ? `höchstens ${z(W.wMax)} mm` : "keine zwei Schraubenreihen"} zu. Kleinere Schraube oder breitere Stütze wählen.`];
    return [`Nicht lösbar: Wurzelmaß w = ${z(W.w)} mm muss ${unten} und höchstens ${z(W.wMax)} mm (Randabstand 1,2 d_{0} im Stützenflansch) betragen. ` +
      "Wurzelmaß auf „automatisch“ stellen (Feld leeren)."];
  }
  if (W.auto && W.wMinS > W.wMinT + 20) return [`Wurzelmaß w = ${z(W.w)} mm aus der Stütze bestimmt: Scheibe frei neben Steg und Ausrundung (t_{w} + 2 r + d_{U} = ${z(W.wMinS)} mm).`];
  if (W.auto && W.w < auf5(Math.max(W.wMinT + 20, 2.4 * d0))) return [`Wurzelmaß w auf ${z(W.w)} mm verkleinert, damit der Randabstand im Stützenflansch eingehalten ist.`];
  return [];
}

// Randabstand e2 einer Stirnplatte mit Wurzelmaß w: 1,5 d0, bei schmalem Stützenflansch (Breite bS)
// bis 1,2 d0 verkleinert, damit die Platte nicht übersteht
export function plattenRand(m, w, bS) {
  const { d0 } = SCHRAUBEN[m], std = auf5(1.5 * d0), frei = (bS - w) / 2;
  if (frei >= std) return std;
  return frei >= 1.2 * d0 - 0.05 ? frei : Math.ceil(1.2 * d0 - 1e-9); // bündig mit dem Flansch, sonst Mindestmaß (Platte steht über)
}

// Gezeigte Breite einer Stütze in der Ansicht (mm ab Außenfläche des Anschlussflanschs): ganz, solange
// sie neben dem Träger nicht dominiert, sonst nur der Anschlussbereich (damit der Maßstab lesbar bleibt)
export const stuetzeSichtbar = (S, T) => (S.h <= Math.max(200, 0.9 * T.h) ? S.h : Math.max(160, 0.4 * T.h));

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
