import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, reduceMotion } from "../lib/gsap";

/** Число, которое досчитывает от 0, когда появляется на экране */
function Counter({ to }) {
  const ref = useRef(null);
  useGSAP(() => {
    const el = ref.current;
    if (reduceMotion()) {
      el.textContent = to;
      return;
    }
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: "expo.out", onUpdate: () => (el.textContent = Math.round(o.v)) }),
    });
  });
  return <span ref={ref}>0</span>;
}

const FACTS = [
  { num: <Counter to={123} />, unit: "м²", label: "площадь без перегородок — свободная планировка" },
  { num: "4×3,5", unit: "м", label: "два арочных окна с видом на Библиотеку" },
  { num: "4,5", unit: "м", label: "высота потолков — не душно даже на 60 гостей" },
  { num: <Counter to={33} />, label: "линии света — хватит для съёмки вечером" },
];

export default function About() {
  return (
    <section className="section" id="about">
      <div className="wrap">
        <div className="about__head">
          <h2 className="h1 reveal">Пространство, где свет работает на вас.</h2>
          <p className="lead reveal">АРКА&nbsp;123 — зал для тех, кто учит, рассказывает и собирает людей. Огромные окна дают ровный дневной свет, высокие потолки — воздух, а тёплый пол-ёлочка и графитовые акценты — спокойную, дорогую картинку для фото и видео.</p>
        </div>
        <div className="facts">
          {FACTS.map((f) => (
            <div className="fact reveal" key={f.label}>
              <div className="fact__num">{f.num}{f.unit && <small>{f.unit}</small>}</div>
              <p className="fact__label">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
