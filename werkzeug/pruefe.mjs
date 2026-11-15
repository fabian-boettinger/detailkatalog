// pruefe.mjs – alle Details rendern und prüfen (Ersatz für baue_katalog.py).
//
// Aufruf:  node werkzeug/pruefe.mjs [DK-ID ...]
//
// Je Detail: Standardwerte und die im Detail definierten Testvarianten (export const varianten)
// als SVG nach ausgabe/ schreiben (farbe + sw), Prüfliste der Abstände und Layout-Hinweise ausgeben.
// Abbruch (Exit 1), wenn bei Standardwerten ein Abstand nicht eingehalten ist oder in irgendeiner
// Variante eine Layout-Warnung auftritt. Abstandsfehler in Varianten sind erlaubt (die Seite zeigt sie rot).
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DETAILS } from "../details/index.js";
import { loese } from "../js/parameter.js";
import { ladeProfile } from "../js/profile.js";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUS = path.join(WURZEL, "ausgabe");

const profile = await ladeProfile(async (datei) => JSON.parse(await readFile(path.join(WURZEL, "profile", datei), "utf-8")));
await mkdir(AUS, { recursive: true });

const auswahl = process.argv.slice(2);
let fehler = 0;

for (const det of DETAILS) {
  const id = det.meta.id;
  if (auswahl.length && !auswahl.includes(id)) continue;
  // "dk" und "m" sind in der URL belegt (Detail-Nummer, Darstellung)
  const belegt = det.parameter.filter((p) => ["dk", "m"].includes(p.key)).map((p) => p.key);
  if (belegt.length) { console.log(`${id}: Parametername ${belegt.join(", ")} ist für die URL reserviert`); fehler++; }
  const varianten = [{ name: "standard", roh: {} }, ...(det.varianten || [])];
  for (const v of varianten) {
    const { p, info } = loese(det.parameter, v.roh, profile);
    for (const [k, i] of Object.entries(info)) if (i.status === "fehler" || i.status === "grenze") console.log(`  ! ${k}: ${i.meldung}`);
    // Standardwerte: jedes Profil-Feld muss ein Profil des Katalogs treffen
    if (v.name === "standard") for (const d of det.parameter.filter((x) => x.typ === "profil"))
      if (info[d.key] && info[d.key].status === "eigen") { console.log(`  ! ${d.key}: Standard trifft kein Profil (${d.standard})`); fehler++; }
    const z = det.zeichne(p, {});
    const name = v.name === "standard" ? id : `${id}_${v.name}`;
    await writeFile(path.join(AUS, `${name}_farbe.svg`), z.svg("farbe"), "utf-8");
    await writeFile(path.join(AUS, `${name}_sw.svg`), z.svg("sw"), "utf-8");
    const { text, fehler: abst } = z.pruefbericht();
    const lay = z.pruefeLayout();
    console.log(`\n== ${name}  (${z.b} × ${Math.ceil(z.h)} px)`);
    if (text) console.log(text.replace(/^/gm, "  "));
    for (const w of z.tragfaehigkeit()) console.log(`  TRAG ${w.gruppe} ≈ ${w.wert.toFixed(1)} ${w.einheit} (${w.bez})`);
    for (const w of lay) console.log(`  LAYOUT ${w.art}: ${w.text}`);
    if (lay.length) fehler++;
    if (v.name === "standard" && abst.length) { console.log(`  Mindestabstände nicht eingehalten: ${abst.join("; ")}`); fehler++; }
  }
}

if (fehler) { console.log(`\n${fehler} Fehler`); process.exit(1); }
console.log("\nalles in Ordnung");

// Import-Map in index.html: jedes Modul mit Inhalts-Hash (?v=…), damit GitHub Pages bzw. der
// Browser-Cache nach einem Update keine alten und neuen Dateien mischen
{
  const imports = {};
  for (const ordner of ["js", "details"]) {
    for (const datei of (await readdir(path.join(WURZEL, ordner))).filter((f) => f.endsWith(".js")).sort()) {
      const inhalt = await readFile(path.join(WURZEL, ordner, datei));
      const v = createHash("sha1").update(inhalt).digest("hex").slice(0, 8);
      imports[`./${ordner}/${datei}`] = `./${ordner}/${datei}?v=${v}`;
    }
  }
  const html = await readFile(path.join(WURZEL, "index.html"), "utf-8");
  const neu = html
    .replace(/<script type="importmap">[\s\S]*?<\/script>/, `<script type="importmap">${JSON.stringify({ imports })}</script>`)
    .replace(/<script type="module" src="[^"]*app\.js[^"]*"><\/script>/, `<script type="module" src="${imports["./js/app.js"]}"></script>`);
  if (neu !== html) { await writeFile(path.join(WURZEL, "index.html"), neu, "utf-8"); console.log("index.html: Modulversionen aktualisiert"); }
}
