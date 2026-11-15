// werkstoffe.js – Festigkeitsklassen als Auswahllisten für die Details.
// Details stellen ihre Liste aus diesen Gruppen zusammen, je nach Bauteil
// (z. B. Unterzug: Brettschichtholz und Baubuche, BSP-Lamellen: Nadelholz).
//
// Quellen: Nadelholz DIN EN 338, Brettschichtholz DIN EN 14080, BauBuche (Furnierschichtholz
// aus Buche) nach ETA-14/0354 bzw. Zulassung des Herstellers.

const opt = (wert, text = wert) => ({ wert, text });

export const NADELHOLZ = [opt("C16", "C16 (Nadelholz)"), opt("C24", "C24 (Nadelholz)"), opt("C30", "C30 (Nadelholz)")];

export const BRETTSCHICHTHOLZ = ["GL24c", "GL24h", "GL28c", "GL28h", "GL30c", "GL30h", "GL32c", "GL32h"]
  .map((k) => opt(k, `${k} (Brettschichtholz)`));

export const BAUBUCHE = [opt("GL75", "GL75 (BauBuche)")];

// Lagenfolge von BSP (Faserrichtung je Lage, siehe laengsLagen in dk.js)
export const BSP_LAGENFOLGE = [opt("abwechselnd", "abwechselnd (L Q L …)"), opt("doppelt", "Längslagen doppelt (L L Q L L …)")];

// Kurzbezeichnung des Bauteils für die Beschriftung: "BSH", "BauBuche", "KVH/VH"
export function bauteilName(klasse) {
  if (/^GL75$/i.test(klasse)) return "BauBuche";
  if (/^GL/i.test(klasse)) return "BSH";
  return "VH";
}

// Hinweis für Prüfliste/Text, wenn der Werkstoff besondere Regeln hat
export function werkstoffHinweis(klasse) {
  if (/^GL75$/i.test(klasse)) return "BauBuche: Vorbohren, Abstände und Einschraubtiefen nach ETA der Schraube für Buche-FSH";
  return "";
}
