import { useEffect, useRef, useState } from "react";
import { brandMapStyle } from "../lib/mapStyle";

const ARKA = [27.65021, 53.93078]; // ул. Мстиславца, 10
const LIBRARY = [27.64617, 53.93122]; // Национальная библиотека
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const MARK_SVG = `<svg viewBox="0 0 674 770" aria-hidden="true"><path d="M 0 744 L 674 744" class="stroke"/><path d="M 27 744 L 27 336 A 310 310 0 0 1 647 336 L 647 744" class="stroke"/><rect x="150" y="304" width="55" height="466" class="fill"/><polygon points="135,304 151,304 151,364 84,364" class="fill"/><path d="M 252 406 L 252 376 A 51 51 0 1 1 342 409 L 240 614 L 381 614" class="stroke"/><path d="M 416 327 L 578 327 L 459 466 A 78 78 0 1 1 414 537" class="stroke" style="stroke-linejoin:bevel"/></svg>`;

function pin(className, html) {
  const el = document.createElement("div");
  el.className = className;
  el.innerHTML = html;
  return el;
}

/** Карта «Как добраться» в палитре сайта; MapLibre грузится отдельным чанком, только когда блок рядом */
export default function PlaceMap() {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let map = null;
    let cancelled = false;
    const el = ref.current;

    const init = async () => {
      try {
        const [{ default: maplibregl }, style] = await Promise.all([
          import("maplibre-gl"),
          fetch(STYLE_URL).then((r) => r.json()),
          import("maplibre-gl/dist/maplibre-gl.css"),
        ]);
        if (cancelled) return;
        map = new maplibregl.Map({
          container: el,
          style: brandMapStyle(style),
          center: [(ARKA[0] + LIBRARY[0]) / 2, (ARKA[1] + LIBRARY[1]) / 2],
          zoom: 15.6,
          attributionControl: { compact: true },
          // колесо не перехватывает прокрутку страницы, на телефоне — двумя пальцами
          cooperativeGestures: true,
          locale: {
            "CooperativeGesturesHandler.WindowsHelpText": "Чтобы приблизить карту, прокрутите колесо с зажатым Ctrl",
            "CooperativeGesturesHandler.MacHelpText": "Чтобы приблизить карту, прокрутите колесо с зажатым ⌘",
            "CooperativeGesturesHandler.MobileHelpText": "Двигайте карту двумя пальцами",
            "NavigationControl.ZoomIn": "Приблизить",
            "NavigationControl.ZoomOut": "Отдалить",
          },
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        new maplibregl.Marker({ element: pin("map-pin map-pin--arka", `<span class="mark">${MARK_SVG}</span>АРКА 123`), anchor: "bottom" })
          .setLngLat(ARKA).addTo(map);
        new maplibregl.Marker({ element: pin("map-pin map-pin--lib", "<i></i>Национальная библиотека"), anchor: "bottom" })
          .setLngLat(LIBRARY).addTo(map);
        map.on("load", () => map.fitBounds([LIBRARY, ARKA], { padding: { top: 110, bottom: 80, left: 150, right: 110 }, maxZoom: 16, duration: 0 }));
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    // грузим карту, только когда блок подъезжает к экрану
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        init();
      }
    }, { rootMargin: "400px" });
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      map?.remove();
    };
  }, []);

  return (
    <div className="place__map reveal">
      <div ref={ref} className="place__map-canvas" aria-label="Карта: АРКА 123 напротив Национальной библиотеки" role="img" />
      {failed && <img className="place__map-fallback" src="/assets/img/p16.jpg" alt="Променад у здания на Мстиславца, 10" />}
    </div>
  );
}
