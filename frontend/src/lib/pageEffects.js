import { gsap, ScrollTrigger, reduceMotion } from "./gsap";

/** После заставки всегда начинаем с первого экрана: браузер иначе вернёт прежнюю позицию или прыгнет к #якорю */
export function resetScrollOnLoad() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  ScrollTrigger.clearScrollMemory("manual");
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  scrollTo(0, 0);
  addEventListener("load", () => scrollTo(0, 0), { once: true });
}

/** Плавная прокрутка к разделам по ссылкам-якорям (делегирование — работает и для ссылок, отрисованных позже) */
export function enableSmoothAnchors() {
  const onClick = (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id === "#") return;
    const target = id === "#top" ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    const y = target === 0 ? 0 : target.getBoundingClientRect().top + scrollY - 84; // отступ под шапку
    gsap.to(window, {
      scrollTo: { y, autoKill: true }, // любой скролл пользователя прерывает анимацию
      duration: reduceMotion() ? 0 : gsap.utils.clamp(0.6, 1.4, Math.abs(y - scrollY) / 2500),
      ease: "power3.inOut",
    });
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}

/** Появление блоков .reveal при скролле */
export function revealOnScroll() {
  if (reduceMotion()) {
    gsap.set(".reveal", { opacity: 1 });
    return;
  }
  gsap.set(".reveal", { y: 28 });
  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.07, overwrite: true }),
  });
}
