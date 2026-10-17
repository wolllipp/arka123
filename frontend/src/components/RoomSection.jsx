import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, reduceMotion } from "../lib/gsap";

const LAYOUTS = [
  { id: "empty", title: "Пустой зал", info: ["Свободная планировка", "123 м²", "зал без мебели"] },
  { id: "lecture", title: "Лекция", info: ["Лекция · рядами", "48 мест", "экран 3 м и проектор"] },
  { id: "table", title: "Общий стол", info: ["Общий стол", "24 места", "переговоры, ужин, воркшоп"] },
  { id: "groups", title: "Группы", info: ["Группы", "36 мест", "6 столов по 6 человек"] },
];

export default function RoomSection() {
  const stageRef = useRef(null);
  const windowTagRef = useRef(null);
  const ceilingTagRef = useRef(null);
  const libTagRef = useRef(null);
  const roomRef = useRef(null);
  const infoRef = useRef(null);
  const segRef = useRef(null);
  const pillRef = useRef(null);

  const [layout, setLayout] = useState("empty");
  const [info, setInfo] = useState(LAYOUTS[0].info);
  const [dusk, setDusk] = useState(false);
  const [inside, setInside] = useState(false);
  const [noWebGL, setNoWebGL] = useState(false);

  // сцена живёт столько же, сколько компонент; Three.js грузится отдельным чанком, не задерживая первый экран
  useEffect(() => {
    let room = null;
    let cancelled = false;
    import("../three/createRoom").then(({ createRoom }) => {
      if (cancelled) return;
      room = createRoom({
        stage: stageRef.current,
        tags: { window: windowTagRef.current, ceiling: ceilingTagRef.current, lib: libTagRef.current },
        onFallback: () => setNoWebGL(true),
      });
      roomRef.current = room;
    });
    return () => {
      cancelled = true;
      room?.dispose();
      roomRef.current = null;
    };
  }, []);

  // плашка «сегмента» едет под активную кнопку
  useLayoutEffect(() => {
    const place = () => {
      const btn = segRef.current?.querySelector('[aria-pressed="true"]');
      if (!btn) return;
      pillRef.current.style.width = btn.offsetWidth + "px";
      pillRef.current.style.translate = btn.offsetLeft + "px 0";
    };
    place();
    document.fonts?.ready.then(place);
    addEventListener("resize", place);
    return () => removeEventListener("resize", place);
  }, [layout]);

  const chooseLayout = (next) => {
    if (next.id === layout) return;
    setLayout(next.id);
    roomRef.current?.setLayout(next.id);
    // подпись меняется через короткое размытие
    if (reduceMotion()) return setInfo(next.info);
    gsap.timeline()
      .to(infoRef.current, { opacity: 0, y: -6, filter: "blur(4px)", duration: 0.15, ease: "power2.in" })
      .add(() => setInfo(next.info))
      .to(infoRef.current, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "expo.out" });
  };

  const toggleDusk = () => {
    roomRef.current?.setDusk(!dusk);
    setDusk(!dusk);
  };

  const toggleInside = () => {
    roomRef.current?.setInside(!inside);
    setInside(!inside);
  };

  return (
    <section className="room" id="room">
      <div className="wrap room__head">
        <div>
          <h2 className="h1">Покрутите. Расставьте.<br />Представьте своё событие.</h2>
        </div>
        <p className="lead">Модель собрана по реальным размерам зала. Переключайте рассадку и время суток — и посмотрите, как свет из арок ложится на пол.</p>
      </div>

      <div className="room__stage" ref={stageRef}>
        <div className="room__info" ref={infoRef}>
          <div className="eyebrow">{info[0]}</div>
          <strong>{info[1]}</strong>
          <span>{info[2]}</span>
        </div>
        <div className="room__hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M11 11.5v-2a1.5 1.5 0 0 1 3 0V12" /><path d="M14 10.5a1.5 1.5 0 0 1 3 0V12" /><path d="M17 11.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7L4.3 15a1.5 1.5 0 0 1 2.4-1.8L8 15" /></svg>
          Потяните, чтобы повернуть · после клика колесо — зум
        </div>

        <div className="tag" data-tag="window" ref={windowTagRef}><i></i>Окно 4 × 3,5 м</div>
        <div className="tag" data-tag="ceiling" ref={ceilingTagRef}><i></i>Потолок 4,5 м</div>
        <div className="tag" data-tag="lib" ref={libTagRef}><i></i>Национальная библиотека</div>

        <div className="dock" role="toolbar" aria-label="Управление 3D-залом">
          <div className="seg" ref={segRef}>
            <span className="seg__pill" ref={pillRef} aria-hidden="true"></span>
            {LAYOUTS.map((l) => (
              <button key={l.id} type="button" aria-pressed={layout === l.id} onClick={() => chooseLayout(l)}>{l.title}</button>
            ))}
          </div>
          <span className="dock__sep"></span>
          <button className="dock__icon" type="button" aria-pressed={dusk} aria-label={dusk ? "День" : "Закат"} onClick={toggleDusk}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 18a5 5 0 0 0-10 0" /><path d="M12 2v7M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M16 5l-4 4-4-4" /></svg>
          </button>
          <button className="dock__icon" type="button" aria-pressed={inside} aria-label={inside ? "Вернуться к обзору" : "Встать внутри зала"} onClick={toggleInside}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
        </div>
        {noWebGL && <div className="room__fallback" style={{ display: "grid" }}>3D-просмотр недоступен в этом браузере — смотрите фотографии в галерее ниже.</div>}
      </div>
    </section>
  );
}
