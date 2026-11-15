// profile.js – Profilkatalog laden (Browser: fetch, Node: fs).
// profile/index.json listet die Dateien; jede Datei enthält {titel, quelle, reihen: {Name: {felder, profile:[...]}}}.

export async function ladeProfile(ladeJson) {
  const m = new Map();
  const index = await ladeJson("index.json");
  for (const datei of index.dateien) {
    const j = await ladeJson(datei);
    for (const [reihe, def] of Object.entries(j.reihen)) {
      m.set(reihe, { ...def, reihe, quelle: def.quelle || j.quelle, hinweis: def.hinweis || j.hinweis, datei });
    }
  }
  return m;
}
