/* Перекраска векторного стиля OpenFreeMap (positron) в палитру сайта:
   молочная земля, белые улицы, приглушённая вода и зелень, графитовые подписи. */

const C = {
  land: "#ece6da",
  residential: "#e7e0d2",
  park: "#dfdfcb",
  water: "#cdd6d8",
  building: "#ddd3c2",
  minor: "#f8f5ef",
  major: "#ffffff",
  casing: "#d9cfbf",
  motorway: "#f6e3c9", // тёплый оттенок «заката» — главные магистрали
  rail: "#cbc2b2",
  text: "#66737d",
  textStrong: "#3b4b57",
  halo: "#f4f0e8",
};

export function brandMapStyle(style) {
  style.layers = style.layers
    // убираем шум: щиты трасс, границы, подписи стран, аэропорты и пешеходные дорожки парковок
    .filter((l) => !/shield|boundary|label_country|label_state|aeroway|highway_path|highway-name-path/.test(l.id))
    .map((l) => {
      const id = l.id;
      const p = { ...(l.paint || {}) };
      if (l.type === "background") p["background-color"] = C.land;
      else if (id === "water") p["fill-color"] = C.water;
      else if (id === "waterway") p["line-color"] = C.water;
      else if (id === "park" || id.startsWith("landcover")) { p["fill-color"] = C.park; p["fill-opacity"] = 1; }
      else if (id === "landuse_residential") { p["fill-color"] = C.residential; p["fill-opacity"] = 1; }
      else if (id === "building") { p["fill-color"] = C.building; p["fill-outline-color"] = C.casing; }
      // дороги и рельсы — только линии и площади; подписи улиц («highway-name-*») сюда не попадают
      else if (l.type === "line" && /casing/.test(id)) p["line-color"] = C.casing;
      else if (l.type === "line" && /motorway/.test(id)) p["line-color"] = C.motorway;
      else if (l.type === "line" && /major|pier/.test(id)) p["line-color"] = C.major;
      else if (l.type === "fill" && /area|pier/.test(id)) p["fill-color"] = C.major;
      else if (l.type === "line" && /minor|path/.test(id)) p["line-color"] = C.minor;
      else if (l.type === "line" && /rail/.test(id)) p["line-color"] = C.rail;
      const layout = { ...(l.layout || {}) };
      if (l.type === "symbol" && layout["text-field"]) {
        // подписи по-русски (если есть), иначе — местное название; без латинской транслитерации
        layout["text-field"] = ["coalesce", ["get", "name:ru"], ["get", "name"]];
      }
      if (l.type === "symbol") {
        p["text-color"] = /label_city/.test(id) ? C.textStrong : C.text;
        p["text-halo-color"] = C.halo;
        p["text-halo-width"] = 1.4;
      }
      return { ...l, paint: p, layout };
    });
  return style;
}
