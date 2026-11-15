// Liste aller Details. Neues Detail: Datei details/dk-xx-nn.js anlegen und hier eintragen.
// Jede Datei exportiert: meta {id, titel, kategorie, beschreibung, nachweise[], faustwerte[]},
// parameter[] (siehe js/parameter.js), zeichne(p, opt) -> Zeichnung (js/dk.js) mit pruefe()
// und optional varianten[] (Testfälle für werkzeug/pruefe.mjs).
import * as dk_ho_02 from "./dk-ho-02.js";
import * as dk_ho_03 from "./dk-ho-03.js";
import * as dk_ho_04 from "./dk-ho-04.js";
import * as dk_ho_05 from "./dk-ho-05.js";
import * as dk_st_01 from "./dk-st-01.js";
import * as dk_st_02 from "./dk-st-02.js";
import * as dk_st_03 from "./dk-st-03.js";
import * as dk_st_04 from "./dk-st-04.js";
import * as dk_st_05 from "./dk-st-05.js";

export const DETAILS = [dk_ho_02, dk_ho_03, dk_ho_04, dk_ho_05, dk_st_01, dk_st_02, dk_st_03, dk_st_04, dk_st_05];
