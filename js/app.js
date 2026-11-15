// app.js – Katalogseite: Liste mit Suche/Filter, Detailansicht mit Eingabefeldern,
// Rendern (Farbe / s/w), Prüfliste, Layout-Hinweise, Bild kopieren, Zustand in der URL.
import { textTeile } from "./dk.js";
import { loese, alsText, fuellEintraege, holeReihe } from "./parameter.js";
import { ladeProfile } from "./profile.js";
import { DETAILS } from "../details/index.js";

window.DK_GELADEN = true; // Zeichen für index.html: Module vollständig geladen

const SKALA = 3; // 940 px Zeichnung -> 2820 px PNG, ca. 300 dpi auf 24 cm Breite

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const index = (s) => esc(s).replace(/_\{([^}]*)\}/g, "<sub>$1</sub>");
const svgUrl = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
const ohneLinks = (s) => s.replace(/\[\[([^\]|]*)(\|[^\]]*)?\]\]/g, "$1");

let modus = "farbe";
let kategorie = "Alle";
let PROFILE = null; // Map reihe -> {profile, ...}
let aktiv = null; // {det, roh}
let renderTimer = null;
try { modus = localStorage.getItem("dk-modus") === "sw" ? "sw" : "farbe"; } catch (e) {}

// --- Textbreite im Browser messen (gleiche Schriftliste wie im SVG) ---------------
const leinwand = document.createElement("canvas").getContext("2d");
function messe(s, groesse = 14, fett = false) {
  let w = 0;
  for (const { t, index: idx } of textTeile(s)) {
    const g = groesse * (idx ? 0.75 : 1);
    leinwand.font = `${fett ? "bold " : ""}${g}px Inter, "DejaVu Sans", Arial, sans-serif`;
    w += leinwand.measureText(t).width;
  }
  return w;
}

function zeichne(det, roh) {
  const { p, info } = loese(det.parameter, roh, PROFILE);
  const z = det.zeichne(p, { messe });
  return { z, p, info, farbe: z.svg("farbe"), sw: z.svg("sw") };
}

function meldung(t) { $("#status").textContent = t; }

// --- Liste ---------------------------------------------------------------------------
function zeichneChips() {
  const kats = ["Alle", ...new Set(DETAILS.map((d) => d.meta.kategorie))];
  $("#chips").innerHTML = kats.map((k) =>
    `<button class="chip" type="button" data-k="${esc(k)}" aria-pressed="${k === kategorie}">${esc(k)}</button>`).join("");
}

function passt(det, q, svg) {
  const m = det.meta;
  if (kategorie !== "Alle" && m.kategorie !== kategorie) return false;
  if (!q) return true;
  const norm = (s) => s.toLowerCase().replace(/[_{}]/g, "");
  // Suchtext: Metadaten plus alle Beschriftungen der Zeichnung (z. B. "MEd", "Stirnplatte")
  const heu = norm([m.id, m.titel, m.kategorie, m.beschreibung, ...m.nachweise, ...m.faustwerte,
    svg.replace(/<defs>[\s\S]*?<\/defs>/, "").replace(/<[^>]+>/g, " ")].join(" "));
  return norm(q).split(/\s+/).every((w) => heu.includes(w));
}

const cache = new Map(); // id -> {farbe, sw, b, h}
function standardBild(det) {
  if (!cache.has(det.meta.id)) {
    const r = zeichne(det, {});
    const ber = det.meta.vorschau || {};
    cache.set(det.meta.id, { farbe: r.farbe, sw: r.sw, b: r.z.b, h: Math.ceil(r.z.h), fehler: r.z.pruefungen.filter((x) => !x.ok).length,
      vorschau: { farbe: r.z.vorschau("farbe", ber), sw: r.z.vorschau("sw", ber) } });
  }
  return cache.get(det.meta.id);
}

function zeichneListe() {
  const q = $("#suche").value.trim();
  const treffer = DETAILS.filter((d) => passt(d, q, standardBild(d).farbe));
  // Kacheln: kleines Vorschaubild, Nummer, Titel; Klick öffnet das Detail
  $("#liste").innerHTML = treffer.length ? treffer.map((det) => {
    const m = det.meta, b = standardBild(det);
    return `
    <a class="kachel" href="?dk=${encodeURIComponent(m.id)}" data-oeffne="${esc(m.id)}" title="${esc(m.beschreibung)}">
      <span class="vorschau"><img src="${svgUrl(b.vorschau[modus])}" alt="" loading="lazy"></span>
      <span class="kachel-text"><span class="nr">${esc(m.id)}</span><span class="kachel-titel">${esc(m.titel)}</span></span>
    </a>`;
  }).join("")
    : `<div class="leer">${q ? `Kein Detail passt zu „${esc(q)}“. Suche ändern oder Kategorie „Alle“ wählen.` : "Keine Details in dieser Kategorie."}</div>`;
  meldung(`${treffer.length} von ${DETAILS.length} Details · Darstellung: ${modus === "farbe" ? "Farbe" : "Schwarz-weiß"}`);
}

// --- Detailansicht ---------------------------------------------------------------------
function profilOptionen(d, gewaehlt) {
  const r = holeReihe(PROFILE, d.reihe);
  if (!r) return `<option>${esc(gewaehlt)}</option>`;
  // Profil ohne einzeln änderbare Maße (alle Ziele verborgen): keine Option „eigene Maße“
  const nurProfil = fuellEintraege(d).every(([, k]) => (aktiv.det.parameter.find((x) => x.key === k) || {}).verborgen);
  const gruppen = new Map();
  for (const p of r.profile) {
    const g = p.gruppe || "";
    if (!gruppen.has(g)) gruppen.set(g, []);
    gruppen.get(g).push(p);
  }
  const opt = (p) => `<option value="${esc(p.name)}"${p.name === gewaehlt ? " selected" : ""}>${esc(p.name)}</option>`;
  return (nurProfil ? "" : `<option value=""${gewaehlt ? "" : " selected"}>— eigene Maße —</option>`) + [...gruppen].map(([g, ps]) => (g ? `<optgroup label="${esc(g)}">${ps.map(opt).join("")}</optgroup>` : ps.map(opt).join(""))).join("");
}

function baueFormular() {
  const { det, roh } = aktiv;
  const { p } = loese(det.parameter, roh, PROFILE);
  const gruppen = new Map();
  for (const d of det.parameter) {
    const g = d.gruppe || "Eingaben";
    if (!gruppen.has(g)) gruppen.set(g, []);
    gruppen.get(g).push(d);
  }
  // Hauptgruppen oben; Parameter mit weitere: true unter „Weitere Eingaben“ (zugeklappt),
  // verborgen: true gar nicht (z. B. Profilmaße, die nur aus dem Profil kommen)
  const feldHtml = (ds) => ds.filter((d) => !d.verborgen).map((d) => {
        const id = `e-${d.key}`;
        const einheit = d.einheit ? `<span class="einheit">${esc(d.einheit)}</span>` : "";
        let feld;
        if (d.typ === "profil") feld = `<select id="${id}" data-key="${esc(d.key)}">${profilOptionen(d, p[d.key])}</select>`;
        else if (d.typ === "auswahl") feld = `<select id="${id}" data-key="${esc(d.key)}">${d.optionen.map((o) => `<option value="${esc(o.wert)}"${String(o.wert) === String(p[d.key]) ? " selected" : ""}>${esc(o.text)}</option>`).join("")}</select>`;
        else feld = `<input id="${id}" data-key="${esc(d.key)}" type="text" inputmode="${d.typ === "zahl" ? "decimal" : "text"}" value="${esc(istAuto(d, p) ? "" : alsText(d, p[d.key]))}" autocomplete="off" spellcheck="false">`;
        const grenzen = d.typ === "zahl" && d.min !== undefined ? ` <span class="grenzen">${d.min}–${d.max}</span>` : "";
        return `<div class="eingabe" data-feld="${esc(d.key)}">
          <label for="${id}">${index(d.label)}${grenzen}</label>
          <div class="wert">${feld}${einheit}</div>
          <small class="hinweis" data-hinweis="${esc(d.key)}">${d.hilfe ? esc(d.hilfe) : ""}</small>
        </div>`;
      }).join("");
  const block = (filter) => [...gruppen].map(([g, ds]) => {
    const f = ds.filter(filter).filter((d) => !d.verborgen);
    return f.length ? `<fieldset><legend>${esc(g)}</legend>${feldHtml(f)}</fieldset>` : "";
  }).join("");
  const haupt = block((d) => !d.weitere), weitere = block((d) => d.weitere);
  const offen = det.parameter.some((d) => d.weitere && roh[d.key] !== undefined);
  $("#eingaben").innerHTML = haupt + (weitere ? `<details class="weitere"${offen ? " open" : ""}><summary>Weitere Eingaben</summary>${weitere}</details>` : "");
}

// Parameter mit auto: true und Wert 0: das Detail ermittelt den Wert (z.auto), das Feld bleibt leer
const istAuto = (d, p) => !!d.auto && Number(p[d.key]) === 0;

// Formularwerte nach einer Profilwahl aktualisieren, ohne den Fokus zu verlieren
function aktualisiereFormular(p, info, auto = {}) {
  for (const d of aktiv.det.parameter) {
    const el = $(`[data-key="${CSS.escape(d.key)}"]`, $("#eingaben"));
    if (el && d.auto) el.placeholder = auto[d.key] !== undefined ? `${fmtZ(auto[d.key])} (automatisch)` : "";
    if (el && document.activeElement !== el) {
      if (d.typ === "profil" || d.typ === "auswahl") el.value = String(p[d.key] ?? "");
      else el.value = istAuto(d, p) ? "" : alsText(d, p[d.key]);
    }
    const h = $(`[data-hinweis="${CSS.escape(d.key)}"]`);
    if (!h) continue; // verborgene Parameter
    const i = info[d.key] || { status: "ok" };
    const box = $(`[data-feld="${CSS.escape(d.key)}"]`);
    box.dataset.status = i.status;
    h.textContent = i.meldung || d.hilfe || "";
  }
}

function urlFuerAktiv() {
  const u = new URLSearchParams();
  u.set("dk", aktiv.det.meta.id);
  for (const d of aktiv.det.parameter) {
    const t = aktiv.roh[d.key];
    if (t !== undefined && t !== "" && t !== alsText(d, d.standard)) u.set(d.key, t);
  }
  if (modus === "sw") u.set("m", "sw");
  return "?" + u.toString();
}

let letztes = null; // letztes Ergebnis in der Detailansicht
function renderDetail() {
  const r = zeichne(aktiv.det, aktiv.roh);
  letztes = { ...r, b: r.z.b, h: Math.ceil(r.z.h), id: aktiv.det.meta.id, titel: aktiv.det.meta.titel };
  const img = $("#d-bild");
  img.src = svgUrl(r[modus]);
  img.width = r.z.b; img.height = Math.ceil(r.z.h);
  aktualisiereFormular(r.p, r.info, r.z.auto);

  const pr = r.z.pruefungen;
  const nein = pr.filter((x) => !x.ok).length;
  // Automatik: was an die Profile angepasst wurde bzw. was sich nicht lösen lässt
  const anp = r.z.anpassungen || [];
  $("#d-pruefung").innerHTML = (anp.length ? `<ul class="anpassungen">${anp.map((t) => `<li${t.startsWith("Nicht lösbar") ? ' class="nein"' : ""}>${index(t)}</li>`).join("")}</ul>` : "") + (pr.length ? `
    <table><thead><tr><th>Abstand</th><th class="z">ist</th><th class="z">soll</th><th></th></tr></thead><tbody>
    ${pr.map((x) => `<tr class="${x.ok ? "ok" : "nein"}"><td>${index(x.bez)}${x.grundlage ? `<br><span class="grundlage">${index(x.grundlage)}</span>` : ""}</td><td class="z">${fmtZ(x.ist)}</td><td class="z">≥ ${fmtZ(x.soll)}</td><td>${x.ok ? "ok" : "nicht eingehalten"}</td></tr>`).join("")}
    </tbody></table>` : `<p class="leise">Keine Abstandsprüfung (schematisches Detail).</p>`);
  $("#d-pruefung-kopf").textContent = pr.length ? (nein ? `Abstände: ${nein} von ${pr.length} nicht eingehalten` : `Abstände: alle ${pr.length} eingehalten`) : "Abstände";
  $("#d-pruefung-kopf").dataset.status = nein ? "nein" : "ok";

  // Tragfähigkeit (überschlägig): maßgebender Wert je Gruppe und alle Komponenten
  const tw = r.z.widerstaende, tm = r.z.tragfaehigkeit();
  $("#d-trag-wrap").hidden = tw.length === 0 && r.z.tragHinweise.length === 0;
  const fmtK = (v) => (v >= 100 ? String(Math.round(v)) : fmtZ(v));
  $("#d-trag").innerHTML = (tm.length ? `<p class="trag-ergebnis">${tm.map((w) => `<span>${index(w.gruppe)} ≈ <strong>${fmtK(w.wert)} ${esc(w.einheit)}</strong> <span class="leise">(${index(w.bez)})</span></span>`).join("")}</p>` : "") +
    (tw.length ? `<table><thead><tr><th>Komponente</th><th class="z">R<sub>d</sub></th><th></th></tr></thead><tbody>
    ${tw.map((w) => `<tr${tm.includes(w) ? ' class="massgebend"' : ""}><td>${index(w.bez)}${w.grundlage ? `<br><span class="grundlage">${index(w.grundlage)}</span>` : ""}</td><td class="z">${fmtK(w.wert)} ${esc(w.einheit)}</td><td class="z">${index(w.gruppe)}</td></tr>`).join("")}
    </tbody></table>` : "") +
    (r.z.tragHinweise.length ? `<ul class="trag-hinweise">${r.z.tragHinweise.map((t) => `<li>${index(t)}</li>`).join("")}</ul>` : "");

  const lw = r.z.pruefeLayout();
  $("#d-layout").innerHTML = lw.length
    ? `<ul>${lw.map((w) => `<li><strong>${esc(w.art)}:</strong> ${esc(w.text)}</li>`).join("")}</ul>`
    : `<p class="leise">Keine Überlappungen, Freistreifen zwischen den Feldern frei.</p>`;
  $("#d-layout-kopf").dataset.status = lw.length ? "warnung" : "ok";
  $("#d-layout-kopf").textContent = lw.length ? `Layout: ${lw.length} Hinweis${lw.length > 1 ? "e" : ""}` : "Layout: in Ordnung";

  history.replaceState(null, "", urlFuerAktiv());
  // Nachweis im Bemessungstool: gleiche Eingaben über den URL-Teil nach #
  $("#d-nachweis").href = `${BEMESSUNGSTOOL}#${encodeURIComponent(aktiv.det.meta.id)}&${urlFuerAktiv().slice(1)}`;
}
const BEMESSUNGSTOOL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ? "http://127.0.0.1:8001/detailkatalog/index.html" : "https://fabian-boettinger.github.io/bemessungstool/detailkatalog/index.html";
const fmtZ = (v) => String(Math.round(v * 10) / 10).replace(".", ",");

function oeffneDetail(id, roh = {}, push = true) {
  const det = DETAILS.find((d) => d.meta.id === id);
  if (!det) return zeigeListe(push);
  aktiv = { det, roh: { ...roh } };
  const m = det.meta;
  $("#d-nr").textContent = m.id;
  $("#d-kat").textContent = m.kategorie;
  $("#d-titel").textContent = m.titel;
  $("#d-beschreibung").textContent = m.beschreibung;
  $("#d-nachweise").innerHTML = m.nachweise.map((n) => `<li>${index(n)}</li>`).join("");
  $("#d-faustwerte").innerHTML = m.faustwerte.length ? m.faustwerte.map((n) => `<li>${index(ohneLinks(n))}</li>`).join("") : "<li>–</li>";
  $("#d-eingaben-wrap").hidden = det.parameter.length === 0;
  $(".d-raster").classList.toggle("ohne-eingaben", det.parameter.length === 0);
  baueFormular();
  $("#ansicht-liste").hidden = true;
  $("#ansicht-detail").hidden = false;
  if (push) history.pushState(null, "", "?dk=" + encodeURIComponent(id));
  renderDetail();
  document.title = `${m.id} · Detailkatalog`;
  window.scrollTo(0, 0);
}

function zeigeListe(push = true) {
  aktiv = null;
  $("#ansicht-detail").hidden = true;
  $("#ansicht-liste").hidden = false;
  if (push) history.pushState(null, "", location.pathname + (modus === "sw" ? "?m=sw" : ""));
  document.title = "Detailkatalog Tragwerksplanung";
  zeichneListe();
}

// --- Bild / SVG kopieren ------------------------------------------------------------
function alsPng(svg, b, h) {
  return new Promise((ok, fehler) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = b * SKALA; c.height = h * SKALA;
      const g = c.getContext("2d");
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((x) => (x ? ok(x) : fehler(new Error("PNG leer"))), "image/png");
    };
    img.onerror = () => fehler(new Error("SVG nicht lesbar"));
    img.src = svgUrl(svg);
  });
}

async function kopiereBild({ id, titel, svg, b, h }) {
  meldung(`${id}: Bild wird erzeugt …`);
  let blob;
  try { blob = await alsPng(svg, b, h); } catch (e) { meldung(`${id}: Bild konnte nicht erzeugt werden (${e.message}).`); return; }
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    meldung(`${id} kopiert (${b * SKALA} × ${h * SKALA} px, ${modus === "farbe" ? "Farbe" : "Schwarz-weiß"}). In VCmaster mit Strg+V einfügen.`);
  } catch (e) {
    $("#ov-bild").src = URL.createObjectURL(blob);
    $("#ov-bild").alt = titel;
    $("#overlay").hidden = false;
    $("#ov-zu").focus();
    meldung(`${id}: Zwischenablage nicht verfügbar, Bild wird zum manuellen Kopieren angezeigt.`);
  }
}

async function kopiereText(t, ok, id) {
  try { await navigator.clipboard.writeText(t); meldung(`${id}: ${ok}`); }
  catch (e) { meldung(`${id}: Kopieren nicht möglich.`); }
}

// --- Modus ---------------------------------------------------------------------------
function setzeModus(m) {
  modus = m;
  try { localStorage.setItem("dk-modus", m); } catch (e) {}
  $("#modus-farbe").setAttribute("aria-pressed", m === "farbe");
  $("#modus-sw").setAttribute("aria-pressed", m === "sw");
  if (aktiv) renderDetail(); else zeichneListe();
}

// --- Ereignisse ----------------------------------------------------------------------
$("#chips").addEventListener("click", (e) => {
  const b = e.target.closest(".chip");
  if (!b) return;
  kategorie = b.dataset.k; zeichneChips(); if (aktiv) zeigeListe(); else zeichneListe();
});
$("#liste").addEventListener("click", (e) => {
  const o = e.target.closest("[data-oeffne]");
  if (o) { e.preventDefault(); oeffneDetail(o.dataset.oeffne); return; }
});
$("#eingaben").addEventListener("input", (e) => {
  const el = e.target.closest("[data-key]");
  if (!el || el.tagName === "SELECT") return;
  const key = el.dataset.key;
  // Maß einer Profil-Schnellwahl geändert: alle Maße dieser Wahl festhalten, Profil-Feld folgt den Maßen
  const { p } = loese(aktiv.det.parameter, aktiv.roh, PROFILE);
  for (const d of aktiv.det.parameter.filter((x) => x.typ === "profil")) {
    const ziele = fuellEintraege(d);
    if (!ziele.some(([, k]) => k === key)) continue;
    for (const [, k] of ziele) if (aktiv.roh[k] === undefined) aktiv.roh[k] = alsText(aktiv.det.parameter.find((x) => x.key === k), p[k]);
    delete aktiv.roh[d.key];
  }
  aktiv.roh[key] = el.value;
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderDetail, 120);
});
$("#eingaben").addEventListener("change", (e) => {
  const el = e.target.closest("select[data-key]");
  if (!el) return;
  const d = aktiv.det.parameter.find((x) => x.key === el.dataset.key);
  if (d.typ === "profil" && el.value === "") return; // „eigene Maße“: Werte bleiben
  aktiv.roh[d.key] = el.value;
  // Profilwahl: gefüllte Maße folgen wieder dem Profil
  if (d.typ === "profil") for (const [, key] of fuellEintraege(d)) delete aktiv.roh[key];
  renderDetail();
});
$("#d-zurueck").addEventListener("click", (e) => { e.preventDefault(); zeigeListe(); });
$("#d-standard").addEventListener("click", () => { aktiv.roh = {}; baueFormular(); renderDetail(); meldung(`${aktiv.det.meta.id}: Standardwerte`); });
$("#d-kopie").addEventListener("click", () => kopiereBild({ ...letztes, svg: letztes[modus] }));
$("#d-svg").addEventListener("click", () => kopiereText(letztes[modus], "SVG-Code kopiert.", letztes.id));
$("#d-link").addEventListener("click", () => kopiereText(location.href, "Link mit den aktuellen Maßen kopiert.", letztes.id));
$("#ov-zu").addEventListener("click", () => { $("#overlay").hidden = true; });
$("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") $("#overlay").hidden = true; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#overlay").hidden = true; });
$("#suche").addEventListener("input", () => (aktiv ? zeigeListe() : zeichneListe()));
$("#modus-farbe").addEventListener("click", () => setzeModus("farbe"));
$("#modus-sw").addEventListener("click", () => setzeModus("sw"));
window.addEventListener("popstate", () => route(false));

function route(push) {
  const u = new URLSearchParams(location.search);
  if (u.get("m") === "sw") modus = "sw";
  $("#modus-farbe").setAttribute("aria-pressed", modus === "farbe");
  $("#modus-sw").setAttribute("aria-pressed", modus === "sw");
  // Detail-Nummer unter "dk" (nicht "d": das ist z. B. der Schraubendurchmesser); alte Links ?d=DK-… gelten weiter
  let id = u.get("dk");
  if (!id && /^DK-/.test(u.get("d") || "")) { id = u.get("d"); u.delete("d"); }
  if (id) {
    const roh = {};
    for (const [k, v] of u) if (k !== "dk" && k !== "m") roh[k] = v;
    oeffneDetail(id, roh, push);
  } else zeigeListe(push);
}

async function start() {
  try {
    PROFILE = await ladeProfile(async (datei) => {
      const r = await fetch(new URL(`../profile/${datei}`, import.meta.url));
      if (!r.ok) throw new Error(`${datei}: ${r.status}`);
      return r.json();
    });
  } catch (e) {
    PROFILE = null;
    $("#warnung").textContent = `Profilkatalog nicht geladen (${e.message}). Maße bitte direkt eingeben.`;
    $("#warnung").hidden = false;
  }
  zeichneChips();
  route(false);
}
start();
