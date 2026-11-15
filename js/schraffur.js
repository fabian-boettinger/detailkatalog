// schraffur.js – je Fläche erzeugte Schraffuren (keine kachelnden Pattern).
// Alle Funktionen liefern SVG-Pfaddaten (d) in Zeichnungskoordinaten; dk.js schneidet sie per
// clipPath auf die Fläche zu. Der Zufall hat einen festen Seed aus der Geometrie: gleiche Eingaben
// ergeben immer dasselbe Bild.

const r1 = (v) => Math.round(v * 10) / 10;
const pt = (x, y) => `${r1(x)},${r1(y)}`;

// Seed aus Geometrie (FNV-1a über die gerundeten Werte)
export function seedAus(...werte) {
  let h = 2166136261;
  for (const ch of werte.map((v) => (typeof v === "number" ? v.toFixed(1) : String(v))).join("|")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Zufallszahlen 0…1 (mulberry32)
export function zufall(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hirnholz: Jahresringe als konzentrische, leicht wellige Bögen; Mittelpunkt außerhalb der Fläche,
// schräg unterhalb einer unteren Ecke. Abstand ca. 6 px ±20 %.
export function hirnholz(x, y, w, h, seed) {
  const R = zufall(seed);
  const links = R() < 0.5;
  // Abstand des Mittelpunkts nach der kürzeren Seite: Ringe sichtbar gekrümmt wie bei einer Lamelle
  const s = Math.min(w, h);
  const cx = links ? x - (0.1 + 0.4 * R()) * s : x + w + (0.1 + 0.4 * R()) * s;
  const cy = y + h + (0.2 + 0.5 * R()) * s;
  const ecken = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
  const dist = ecken.map(([ex, ey]) => Math.hypot(ex - cx, ey - cy));
  // kleinster Abstand vom Mittelpunkt zur Fläche
  const nx = Math.min(Math.max(cx, x), x + w), ny = Math.min(Math.max(cy, y), y + h);
  const rMin = Math.hypot(nx - cx, ny - cy), rMax = Math.max(...dist);
  const winkel = ecken.map(([ex, ey]) => Math.atan2(ey - cy, ex - cx));
  const a0 = Math.min(...winkel) - 0.05, a1 = Math.max(...winkel) + 0.05;
  const teile = [];
  let r = rMin + (1 + 4 * R());
  while (r < rMax) {
    const amp = 0.5 + 0.6 * R(), frq = 3 + 5 * R(), ph = R() * 6.28;
    const n = Math.max(3, Math.ceil((r * (a1 - a0)) / 7)); // Stützpunkte etwa alle 7 px
    const p = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      const rr = r + amp * Math.sin(frq * a * 6 + ph) + (R() - 0.5) * 0.8;
      p.push(pt(cx + rr * Math.cos(a), cy + rr * Math.sin(a)));
    }
    teile.push("M" + p.join(" L"));
    r += 6 * (0.8 + 0.4 * R());
  }
  return teile.join(" ");
}

// Längsholz: leicht wellige, ungefähr parallele Linien in Faserrichtung (waagerecht oder senkrecht)
export function laengsholz(x, y, w, h, seed, senkrecht = false) {
  const R = zufall(seed);
  // in lokalen Koordinaten: u entlang der Faser, v quer dazu
  const [L, B] = senkrecht ? [h, w] : [w, h];
  const teile = [];
  let v = 2 + 4 * R();
  while (v < B) {
    const p = [];
    let u = -5, dv = 0;
    while (u < L + 5) {
      dv = Math.max(-2, Math.min(2, dv + (R() - 0.5) * 1.6));
      p.push(senkrecht ? pt(x + v + dv, y + u) : pt(x + u, y + v + dv));
      u += 12 + 14 * R();
    }
    p.push(senkrecht ? pt(x + v + dv, y + L + 5) : pt(x + L + 5, y + v + dv));
    teile.push("M" + p.join(" L"));
    v += 6 * (0.8 + 0.4 * R());
  }
  return teile.join(" ");
}

// Furnierschichtholz (z. B. BauBuche) im Querschnitt: feine, fast gerade Linien parallel zu den
// Furnieren (Abstand ca. 2,5 px, symbolisch – echte Furniere sind ca. 3 mm dick). Furniere waagerecht,
// bei senkrecht = true senkrecht im Bild.
export function furnier(x, y, w, h, seed, senkrecht = false) {
  const R = zufall(seed);
  const [L, B] = senkrecht ? [h, w] : [w, h];
  const teile = [];
  let v = 1 + 1.5 * R();
  while (v < B) {
    const p = [];
    for (let u = -2; u < L + 2; u += 18 + 10 * R()) {
      const dv = (R() - 0.5) * 0.5;
      p.push(senkrecht ? pt(x + v + dv, y + u) : pt(x + u, y + v + dv));
    }
    p.push(senkrecht ? pt(x + v, y + L + 2) : pt(x + L + 2, y + v));
    teile.push("M" + p.join(" L"));
    v += 2.5 * (0.85 + 0.3 * R());
  }
  return teile.join(" ");
}

// Weiche Dämmung: aneinandergereihte, langgezogene Schlaufen quer über die Dämmdicke,
// abwechselnd mit runder Seite oben und unten. Dicke < 6 px: keine Schlaufen (nur Kontur).
export function daemmSchlaufen(x, y, w, h) {
  const senkrecht = w < h; // Dicke ist die kürzere Seite
  const [L, T] = senkrecht ? [h, w] : [w, h];
  if (T < 6) return "";
  const i = Math.min(1.5, T * 0.08); // Abstand zum Rand
  const r = Math.max(1.5, T * 0.17);
  const schritt = r * 1.45;
  const teile = [];
  const P = (u, v) => (senkrecht ? pt(x + v, y + u) : pt(x + u, y + v));
  let k = 0;
  for (let u = -r; u < L + r; u += schritt, k++) {
    // v läuft quer über die Dicke; bei ungeraden Schlaufen gespiegelt
    const s = k % 2 === 0 ? 1 : -1;
    const vRund = s > 0 ? i + r : T - i - r; // Mittelpunkt der runden Seite
    const vSpitz = s > 0 ? T - i : i;
    const m = vRund + (vSpitz - vRund) * 0.5;
    const sweep = (s > 0) !== senkrecht ? 1 : 0;
    teile.push(
      `M${P(u - r, vRund)} A${r1(r)},${r1(r)} 0 0 ${sweep} ${P(u + r, vRund)}` +
      ` C${P(u + r, m)} ${P(u + 0.25 * r, vSpitz)} ${P(u, vSpitz)}` +
      ` C${P(u - 0.25 * r, vSpitz)} ${P(u - r, m)} ${P(u - r, vRund)} Z`);
  }
  return teile.join(" ");
}

// Spannrichtungssymbol für BSP-Lagen mit Faser in der Zeichenebene: Linie mit halben Pfeilspitzen,
// links Haken nach oben, rechts Haken nach unten (punktsymmetrisch). senkrecht: um 90° gedreht.
export function spannSymbol(cx, cy, laenge, senkrecht = false) {
  const k = Math.min(6, laenge / 4), q = k * 0.7;
  // lokale Punkte (waagerecht), Drehung um 90° für senkrecht
  const lok = [[-laenge / 2, 0], [laenge / 2, 0], [-laenge / 2 + k, -q], [laenge / 2 - k, q]];
  const g = lok.map(([u, v]) => (senkrecht ? [cx - v, cy + u] : [cx + u, cy + v]));
  return `M${pt(...g[2])} L${pt(...g[0])} L${pt(...g[1])} L${pt(...g[3])}`;
}
