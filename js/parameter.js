// parameter.js – Eingaben eines Details auflösen (Browser und Node gemeinsam).
//
// Parameterdefinition je Eingabe:
//   {key, label, typ: "zahl" | "profil" | "auswahl" | "lagen", einheit, standard, min, max,
//    reihe (bei profil), fuellt (bei profil: {Profilfeld: key} oder {Profilfeld: [key, umrechnung, vergleichen]}),
//    optionen (bei auswahl: [{wert, text}]),
//    gruppe (Überschrift im Formular), hilfe}
// typ "lagen": Lagenfolge in mm als Text, z. B. "40-40-80-40-40" (BSP-Aufbau).
//
// Rohwerte (aus URL oder Formular) sind Texte. Ein Profil-Feld ist eine Schnellwahl: es füllt die
// zugehörigen Maße, einzeln eingegebene Maße haben Vorrang. Danach zeigt das Profil-Feld das Profil,
// das zu den Maßen passt, sonst "" (eigene Maße). Einträge mit vergleichen = false (z. B. die
// Decklagenrichtung) werden nur vorbelegt und beim Abgleich nicht berücksichtigt.

export function zahl(t) {
  if (typeof t === "number") return t;
  const v = parseFloat(String(t).trim().replace(",", "."));
  return Number.isFinite(v) ? v : NaN;
}

export function lagenAusText(t) {
  if (Array.isArray(t)) return t.map(Number);
  const teile = String(t).split(/[-–\/\s;]+/).filter(Boolean).map(zahl);
  return teile.length && teile.every((v) => v > 0) ? teile : null;
}

export const lagenText = (a) => a.map((v) => String(v)).join("-");

// Einträge von fuellt als [Profilfeld, key, umrechnung, vergleichen]
export function fuellEintraege(d) {
  return Object.entries(d.fuellt || {}).map(([feld, ziel]) =>
    Array.isArray(ziel) ? [feld, ziel[0], ziel[1] || ((v) => v), ziel[2] !== false] : [feld, ziel, (v) => v, true]);
}

// Reihe(n) eines Profil-Felds: reihe darf ein Name oder eine Liste sein (z. B. ["HEA", "HEB", "HEM"]);
// mehrere Reihen werden zusammengefasst, die Gruppe ist dann der Reihenname
const reihenCache = new WeakMap();
export function holeReihe(profile, reihe) {
  if (!profile) return null;
  if (!Array.isArray(reihe)) return profile.get(reihe) || null;
  let c = reihenCache.get(profile);
  if (!c) reihenCache.set(profile, (c = new Map()));
  const k = reihe.join("|");
  if (!c.has(k)) {
    const teile = reihe.map((r) => profile.get(r)).filter(Boolean);
    c.set(k, teile.length ? { reihe: k, profile: teile.flatMap((t) => t.profile.map((p) => ({ ...p, gruppe: t.reihe }))) } : null);
  }
  return c.get(k);
}

// Profil suchen: profile = Map reihe -> {profile:[{name, ...}]}
export function findeProfil(profile, reihe, name) {
  const r = holeReihe(profile, reihe);
  return r ? r.profile.find((p) => p.name === name) || null : null;
}

// Profil der Reihe, dessen Werte zu p passen (zuerst das bisher gewählte), sonst null
export function passendesProfil(d, p, profile, bevorzugt = null) {
  const r = holeReihe(profile, d.reihe);
  if (!r) return null;
  const gleich = (pr) => fuellEintraege(d).every(([feld, key, um, vergl]) => {
    if (!vergl) return true;
    const v = um(pr[feld], pr);
    if (Array.isArray(v)) return lagenText(v) === lagenText(p[key] || []);
    return typeof v === "number" ? v === Number(p[key]) : String(v) === String(p[key]);
  });
  const erst = bevorzugt ? r.profile.find((pr) => pr.name === bevorzugt) : null;
  if (erst && gleich(erst)) return erst;
  return r.profile.find(gleich) || null;
}

// Liefert {p: aufgelöste Werte, info: key -> {status: "ok"|"eigen"|"grenze"|"fehler", meldung}}
export function loese(parameter, roh = {}, profile = null) {
  const p = {};
  const info = {};
  // 1. Standardwerte
  for (const d of parameter) p[d.key] = d.typ === "lagen" ? lagenAusText(d.standard) : d.standard;
  // 2. Profile (Standard oder gewählt) füllen ihre Maße
  for (const d of parameter.filter((d) => d.typ === "profil")) {
    const name = roh[d.key] ?? d.standard;
    const pr = findeProfil(profile, d.reihe, name);
    if (pr) {
      p[d.key] = name;
      for (const [feld, key, um] of fuellEintraege(d)) if (pr[feld] !== undefined) p[key] = um(pr[feld], pr);
      info[d.key] = { status: "ok" };
    } else if (roh[d.key] !== undefined && profile) {
      info[d.key] = { status: "fehler", meldung: `Profil „${name}“ nicht im Katalog` };
    } else {
      p[d.key] = name;
      info[d.key] = { status: "ok" };
    }
  }
  // 3. Einzelwerte
  for (const d of parameter.filter((d) => d.typ !== "profil")) {
    const t = roh[d.key];
    if (t === undefined || t === "") { info[d.key] = { status: "ok" }; continue; }
    if (d.typ === "zahl") {
      let v = zahl(t);
      if (Number.isNaN(v)) { info[d.key] = { status: "fehler", meldung: "keine Zahl, Standardwert verwendet" }; continue; }
      if (d.min !== undefined && v < d.min) { info[d.key] = { status: "grenze", meldung: `min. ${d.min}` }; v = d.min; }
      else if (d.max !== undefined && v > d.max) { info[d.key] = { status: "grenze", meldung: `max. ${d.max}` }; v = d.max; }
      else info[d.key] = { status: "ok" };
      p[d.key] = v;
    } else if (d.typ === "lagen") {
      const a = lagenAusText(t);
      if (!a) { info[d.key] = { status: "fehler", meldung: "Lagen z. B. 40-40-80-40-40" }; continue; }
      p[d.key] = a;
      info[d.key] = { status: "ok" };
    } else if (d.typ === "auswahl") {
      if (!d.optionen.some((o) => String(o.wert) === String(t))) { info[d.key] = { status: "fehler", meldung: "unbekannte Auswahl" }; continue; }
      const o = d.optionen.find((o) => String(o.wert) === String(t));
      p[d.key] = o.wert;
      info[d.key] = { status: "ok" };
    }
  }
  // 4. Profil-Feld folgt den Maßen: passendes Profil anzeigen, sonst eigene Maße
  if (profile) {
    for (const d of parameter.filter((d) => d.typ === "profil")) {
      if (info[d.key] && info[d.key].status === "fehler") continue;
      const pr = passendesProfil(d, p, profile, p[d.key]);
      p[d.key] = pr ? pr.name : "";
      info[d.key] = pr ? { status: "ok" } : { status: "eigen", meldung: "eigene Maße" };
    }
  }
  return { p, info };
}

// Wert eines Parameters als Text für Formular und URL
export function alsText(d, v) {
  if (d.typ === "lagen") return Array.isArray(v) ? lagenText(v) : String(v ?? "");
  return String(v ?? "");
}
