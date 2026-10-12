import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP, reduceMotion } from "../lib/gsap";
import { createFilmPlayer, loadManifest } from "../lib/filmFrames";

function ArrowRight() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

/** Первый экран + арка-окно, которая раскрывается на скролле.
    Если в public/assets/film есть кадры видео с Мстиславом — после раскрытия арки
    видео прокручивается вместе со страницей (задание 4); иначе в окне — фото зала. */
export default function Hero({ ready }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const playerRef = useRef(null);
  const [film, setFilm] = useState(null);
  const [filmShown, setFilmShown] = useState(false);

  useEffect(() => {
    let alive = true;
    loadManifest().then((m) => alive && setFilm(m));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!film || !canvasRef.current) return;
    let player = null;
    // кадры (~13 МБ) грузим после загрузки страницы — иначе они задерживают заставку
    const start = () => {
      player = createFilmPlayer(canvasRef.current, film, () => setFilmShown(true));
      playerRef.current = player;
      if (reduceMotion()) player.draw(1); // без анимаций — сразу финальный кадр
    };
    if (document.readyState === "complete") start();
    else addEventListener("load", start, { once: true });
    return () => {
      removeEventListener("load", start);
      player?.dispose();
      playerRef.current = null;
    };
  }, [film]);

  // первый экран спрятан под прелоадером и проявляется на месте, когда прелоадер ушёл
  useGSAP(() => {
    gsap.set([".hero__title .line > span", ".reveal-hero"], { opacity: 0 });
  }, { scope: rootRef });

  useGSAP(() => {
    if (!ready) return;
    gsap.timeline({ delay: 0.05 })
      .to(".hero__title .line > span", { opacity: 1, duration: 0.9, ease: "power2.out", stagger: 0.12 }, 0)
      .to(".reveal-hero", { opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.1 }, 0.35);
  }, { scope: rootRef, dependencies: [ready] });

  // окно: pin + scrub, на мобильном арка шире; с видео — после раскрытия арки ещё и прокрутка кадров
  useGSAP(() => {
    if (reduceMotion()) return;
    const mm = gsap.matchMedia();
    mm.add({ desk: "(min-width: 761px)", mob: "(max-width: 760px)" }, (ctx) => {
      const side = ctx.conditions.desk ? 31 : 8;
      const r = ctx.conditions.desk ? 18 : 42;
      const FILM = film ? 2.6 : 0; // длина прокрутки видео — в «экранах» относительно раскрытия арки
      const scrub = { p: 0 };
      const tl = gsap.timeline({ scrollTrigger: { trigger: ".window", start: "top top", end: `+=${130 + FILM * 130}%`, scrub: 0.6, pin: true } })
        .fromTo(".window__frame",
          { clipPath: `inset(0% ${side}% 8% ${side}% round ${r}vw ${r}vw 0vw 0vw)` },
          { clipPath: "inset(0% 0% 0% 0% round 0vw 0vw 0vw 0vw)", ease: "none", duration: 1 })
        .fromTo(".window__media", { scale: 1.18 }, { scale: 1, ease: "none", duration: 1 }, 0);
      if (film) {
        tl.to(scrub, { p: 1, ease: "none", duration: FILM, onUpdate: () => playerRef.current?.draw(scrub.p) }, 1)
          .fromTo(".window__caption", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 1 + FILM - 0.35);
      } else {
        tl.fromTo(".window__caption", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.72);
      }
    });
    // закрепление стало длиннее — остальные триггеры (шапка, появление блоков) пересчитывают позиции
    if (film) requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, { scope: rootRef, dependencies: [film], revertOnUpdate: true });

  return (
    <section className="hero" ref={rootRef}>
      <div className="wrap">
        <div className="hero__addr reveal-hero"><i></i>Минск, ул. Мстиславца, 10 · 2 этаж</div>
        <h1 className="display hero__title">
          <span className="line"><span>Встречаемся</span></span>
          <span className="line"><span>напротив</span></span>
          <span className="line"><span>Библиотеки.</span></span>
        </h1>
        <p className="lead hero__sub reveal-hero">Светлый зал на 123&nbsp;м² с двумя арочными окнами 4&nbsp;×&nbsp;3,5&nbsp;м — для мастер-классов, лекций и семинаров, которые хочется запомнить.</p>
        <div className="hero__cta reveal-hero">
          <a className="btn" href="#book">Выбрать дату <ArrowRight /></a>
          <a className="btn btn--ghost" href="#room">Покрутить зал в 3D</a>
        </div>
      </div>

      <div className="window">
        <div className="window__frame">
          <div className="window__media">
            {/* фото — постер, пока не загрузился первый кадр видео (или если видео нет) */}
            <img src="/assets/img/p01.jpg" alt="Зал АРКА 123 на закате: два арочных окна с видом на Национальную библиотеку" style={filmShown ? { visibility: "hidden" } : undefined} />
            {film && <canvas ref={canvasRef} className="window__film" aria-label="Мстислав встречает гостей и ведёт к окну с видом на Библиотеку" role="img" />}
          </div>
        </div>
        <div className="window__caption">
          <p className="h1">Библиотека — прямо напротив. В каждом кадре вашего события.</p>
        </div>
      </div>
    </section>
  );
}
