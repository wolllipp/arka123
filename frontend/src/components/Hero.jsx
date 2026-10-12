import { useRef } from "react";
import { gsap, useGSAP, reduceMotion } from "../lib/gsap";

function ArrowRight() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

/** Первый экран + арка-окно, которая раскрывается на скролле */
export default function Hero({ ready }) {
  const rootRef = useRef(null);

  // заголовок спрятан под прелоадером и выезжает, когда прелоадер ушёл
  useGSAP(() => {
    gsap.set(".hero__title .line > span", { yPercent: 110 });
    gsap.set(".reveal-hero", { opacity: 0, y: 16 });
  }, { scope: rootRef });

  useGSAP(() => {
    if (!ready) return;
    gsap.timeline({ delay: 0.1 })
      .to(".hero__title .line > span", { yPercent: 0, duration: 1.0, ease: "expo.out", stagger: 0.08 }, 0)
      .to(".reveal-hero", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, 0.3);
  }, { scope: rootRef, dependencies: [ready] });

  // окно: pin + scrub, на мобильном арка шире
  useGSAP(() => {
    if (reduceMotion()) return;
    const mm = gsap.matchMedia();
    mm.add({ desk: "(min-width: 761px)", mob: "(max-width: 760px)" }, (ctx) => {
      const side = ctx.conditions.desk ? 31 : 8;
      const r = ctx.conditions.desk ? 18 : 42;
      gsap.timeline({ scrollTrigger: { trigger: ".window", start: "top top", end: "+=130%", scrub: 0.6, pin: true } })
        .fromTo(".window__frame",
          { clipPath: `inset(0% ${side}% 8% ${side}% round ${r}vw ${r}vw 0vw 0vw)` },
          { clipPath: "inset(0% 0% 0% 0% round 0vw 0vw 0vw 0vw)", ease: "none", duration: 1 })
        .fromTo(".window__frame img", { scale: 1.18 }, { scale: 1, ease: "none", duration: 1 }, 0)
        .fromTo(".window__caption", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.72);
    });
    return () => mm.revert();
  }, { scope: rootRef });

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
          <img src="/assets/img/p01.jpg" alt="Зал АРКА 123 на закате: два арочных окна с видом на Национальную библиотеку" />
        </div>
        <div className="window__caption">
          <p className="h1">Библиотека — прямо напротив. В каждом кадре вашего события.</p>
        </div>
      </div>
    </section>
  );
}
