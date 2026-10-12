import { useRef } from "react";
import { GALLERY } from "../data/content";

function Arrow({ back }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d={back ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6"} />
    </svg>
  );
}

/** Лента арок: стрелки + перетаскивание мышью (на тач-устройствах — родной скролл) */
export default function Gallery() {
  const trackRef = useRef(null);
  const drag = useRef(null);

  const scrollBy = (dir) => trackRef.current.scrollBy({ left: dir * trackRef.current.clientWidth * 0.6, behavior: "smooth" });

  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse") return;
    const track = trackRef.current;
    drag.current = { x: e.clientX, left: track.scrollLeft };
    track.style.scrollSnapType = "none";
    track.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    trackRef.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    trackRef.current.style.scrollSnapType = "";
  };

  return (
    <section className="section gallery" id="gallery">
      <div className="wrap row-head">
        <div>
          <h2 className="h1 reveal">Зал в разное время дня.</h2>
        </div>
        <div className="gallery__nav">
          <button className="round-btn" type="button" aria-label="Назад" onClick={() => scrollBy(-1)}><Arrow back /></button>
          <button className="round-btn" type="button" aria-label="Вперёд" onClick={() => scrollBy(1)}><Arrow /></button>
        </div>
      </div>
      <div className="gallery__track" ref={trackRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        {GALLERY.map((g) => (
          <figure className={"shot" + (g.arch ? " shot--arch" : "")} key={g.img}>
            <img src={`/assets/img/${g.img}`} alt={g.alt} loading="lazy" />
          </figure>
        ))}
      </div>
    </section>
  );
}
