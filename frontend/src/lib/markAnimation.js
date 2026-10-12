import { gsap } from "./gsap";

/* Кривая прорисовки снята с ролика «в стиле Apple» покадрово (доля нарисованной линии
   во времени): уголок появляется сразу, линия долго разгоняется,
   быстро обходит свод и мягко дотягивается по основанию к «1». */
const LINE_CURVE = [
  [0, 0.041], [0.095, 0.044], [0.143, 0.047], [0.19, 0.058], [0.238, 0.074], [0.286, 0.095],
  [0.333, 0.124], [0.381, 0.163], [0.429, 0.211], [0.476, 0.268], [0.524, 0.336], [0.571, 0.418],
  [0.619, 0.512], [0.667, 0.617], [0.714, 0.708], [0.762, 0.78], [0.81, 0.839], [0.857, 0.886],
  [0.905, 0.936], [0.952, 0.975], [1, 1],
];

export const lineEase = (u) => {
  for (let i = 1; i < LINE_CURVE.length; i++) {
    const [u1, p1] = LINE_CURVE[i];
    if (u <= u1) {
      const [u0, p0] = LINE_CURVE[i - 1];
      return p0 + ((p1 - p0) * (u - u0)) / (u1 - u0);
    }
  }
  return 1;
};

/** Прорисовка знака; k — множитель скорости (1 = как в ролике) */
export function markTimeline(svg, k = 1) {
  const line = svg.querySelector(".arch-line");
  const digits = svg.querySelectorAll(".digit");
  const tl = gsap.timeline({ paused: true });
  // через attr, а не CSS: CSSPlugin округляет px, и при pathLength=1 линия прыгала 1 → 0
  tl.set(line, { attr: { "stroke-dasharray": 1, "stroke-dashoffset": 1 } }, 0)
    .set(digits, { opacity: 0, filter: "blur(22px)" }, 0)
    .fromTo(line, { attr: { "stroke-dashoffset": 1 } }, { attr: { "stroke-dashoffset": 0 }, duration: 1.05 * k, ease: lineEase }, 0.15 * k)
    .to(digits, { opacity: 1, filter: "blur(0px)", duration: 0.32 * k, ease: "power2.out", stagger: 0.1 * k }, 1.0 * k)
    .set(digits, { clearProps: "filter" });
  return tl;
}

/** Бесконечная прорисовка знака — запасной лоадер, если видео заблокировано (энергосбережение в Safari) */
export function playMarkLoop(svg) {
  const tl = markTimeline(svg, 0.8);
  tl.to(svg, { opacity: 0, duration: 0.3, ease: "power1.in" }, "+=0.6").set(svg, { opacity: 1 });
  tl.repeat(-1).play();
  return () => tl.kill();
}
