// profildurchlauf.mjs – Stahl-Details mit allen Profilkombinationen des Katalogs durchrechnen.
//
// Aufruf:  node werkzeug/profildurchlauf.mjs [DK-ID ...] [--schrauben] [--liste]
//
// Prüft die automatische Anpassung der Anschlussgeometrie (Schraubenbild, Wurzelmaß, Plattengröße):
// Je Detail werden alle Profile der Profil-Felder kombiniert, die übrigen Eingaben bleiben Standard
// (--schrauben: zusätzlich jede Schraubengröße). Beim DELTABEAM-Detail folgt die DR-Höhe dem Träger.
// Abbruch (Exit 1), wenn
//   - ein Detail abstürzt,
//   - eine Zeichnung Layout-Warnungen hat, obwohl alle Abstände eingehalten sind,
//   - ein Abstand nicht eingehalten ist, ohne dass die Automatik „Nicht lösbar: …“ meldet
//     (dann hätte sie die Geometrie anpassen müssen oder die Meldung fehlt).
// Nicht eingehaltene Abstände mit Meldung sind zulässig: die Profile passen nicht zusammen
// (z. B. Trägerflansch breiter als die Stütze), die Seite zeigt das rot.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DETAILS } from "../details/index.js";
import { loese, holeReihe } from "../js/parameter.js";
import { ladeProfile } from "../js/profile.js";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profile = await ladeProfile(async (datei) => JSON.parse(await readFile(path.join(WURZEL, "profile", datei), "utf-8")));
const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith("--"));
const liste = args.includes("--liste");
let fehler = 0;

for (const det of DETAILS) {
  const id = det.meta.id;
  const pf = det.parameter.filter((d) => d.typ === "profil" && [].concat(d.reihe).some((r) => ["IPE", "HEA", "HEB", "HEM"].includes(r)));
  if (!pf.length || (ids.length && !ids.includes(id))) continue;
  const schr = det.parameter.find((d) => d.key === "schraube");
  const namen = pf.map((d) => holeReihe(profile, d.reihe).profile);
  const kombis = namen.reduce((acc, ns) => acc.flatMap((a) => ns.map((n) => [...a, n])), [[]]);
  for (const M of args.includes("--schrauben") && schr ? schr.optionen.map((o) => o.wert) : [null]) {
    let n = 0, geloest = 0, unloesbar = 0, schlecht = 0;
    const gruende = new Map();
    for (const k of kombis) {
      const roh = Object.fromEntries(pf.map((d, i) => [d.key, k[i].name]));
      if (M) roh.schraube = M;
      if (det.parameter.some((d) => d.key === "h_dr")) roh.h_dr = String(Math.min(600, Math.max(200, Math.ceil(k[0].h / 10) * 10)));
      const name = `${id}${M ? " " + M : ""} ${k.map((x) => x.name).join(" / ")}`;
      n++;
      let z;
      try { z = det.zeichne(loese(det.parameter, roh, profile).p, {}); }
      catch (e) { schlecht++; console.log(`  ABSTURZ ${name}: ${e.message}`); continue; }
      const nein = z.pruefungen.filter((x) => !x.ok);
      const meldung = z.anpassungen.filter((t) => t.startsWith("Nicht lösbar"));
      if (!nein.length) {
        geloest++;
        const lay = z.pruefeLayout();
        if (lay.length) { schlecht++; console.log(`  LAYOUT ${name}: ${lay.map((w) => `${w.art}: ${w.text}`).join("; ")}`); }
      } else if (!meldung.length) {
        schlecht++;
        console.log(`  OHNE MELDUNG ${name}: ${nein.map((x) => x.bez).join("; ")}`);
      } else {
        unloesbar++;
        for (const t of meldung) { const g = t.replace(/[\d,.]+ mm/g, "… mm").replace(/\(.*?\)/g, "").slice(0, 90); gruende.set(g, (gruende.get(g) || 0) + 1); }
        if (liste) console.log(`  ${name}: ${meldung.join(" ")}`);
      }
    }
    console.log(`${id}${M ? " " + M : ""}: ${n} Kombinationen, ${geloest} passen, ${unloesbar} nicht lösbar (gemeldet), ${schlecht} fehlerhaft`);
    for (const [g, c] of [...gruende].sort((a, b) => b[1] - a[1])) console.log(`   ${String(c).padStart(5)} × ${g}`);
    fehler += schlecht;
  }
}

if (fehler) { console.log(`\n${fehler} Fehler`); process.exit(1); }
console.log("\nalles in Ordnung");
