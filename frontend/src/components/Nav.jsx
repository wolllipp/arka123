import { useRef } from "react";
import { ScrollTrigger, useGSAP, reduceMotion } from "../lib/gsap";
import { markTimeline } from "../lib/markAnimation";
import { AnimatedMark } from "./Mark";

const LINKS = [
  ["#about", "О пространстве"],
  ["#room", "Зал в 3D"],
  ["#formats", "Форматы"],
  ["#tariffs", "Тарифы"],
  ["#gallery", "Галерея"],
  ["#reviews", "Отзывы"],
];

export default function Nav() {
  const navRef = useRef(null);
  const markRef = useRef(null);
  const hoverRef = useRef(null);

  useGSAP(() => {
    const nav = navRef.current;
    // прячется при скролле вниз, возвращается при скролле вверх
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      nav.classList.toggle("is-hidden", y > lastY && y > 400);
      lastY = y;
    };
    addEventListener("scroll", onScroll, { passive: true });
    // темнеет над 3D-залом; refreshPriority −1 — пересчитать после pin окна в первом экране,
    // иначе позиция зала считается без добавленной высоты закрепления
    ScrollTrigger.create({ trigger: "#room", start: "top 40px", end: "bottom 40px", refreshPriority: -1, toggleClass: { targets: nav, className: "is-dark" } });
    // ховер на логотипе: знак перерисовывается (вторая часть ролика)
    hoverRef.current = markTimeline(markRef.current, 0.6).progress(1);
    return () => removeEventListener("scroll", onScroll);
  });

  const onLogoEnter = () => {
    const tl = hoverRef.current;
    if (tl && !tl.isActive() && !reduceMotion() && matchMedia("(hover: hover)").matches) tl.restart();
  };

  return (
    <header className="nav" ref={navRef}>
      <a className="nav__logo" href="#top" aria-label="АРКА 123 — наверх" onMouseEnter={onLogoEnter}>
        <AnimatedMark ref={markRef} />
        АРКА 123
      </a>
      <nav className="nav__links" aria-label="Разделы">
        {LINKS.map(([href, title]) => <a key={href} href={href}>{title}</a>)}
      </nav>
      <a className="btn btn--sm" href="#book">Забронировать</a>
    </header>
  );
}

