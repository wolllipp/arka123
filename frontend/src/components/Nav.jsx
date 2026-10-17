import { useEffect, useRef, useState } from "react";
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
// в мобильном меню ещё и адрес — на телефоне его ищут чаще всего
const MOBILE_LINKS = [...LINKS, ["#place", "Как добраться"]];

export default function Nav() {
  const navRef = useRef(null);
  const markRef = useRef(null);
  const hoverRef = useRef(null);
  const [open, setOpen] = useState(false);

  // меню закрывается по Esc, при прокрутке и при переходе к разделу
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e) => e.key === "Escape" && close();
    addEventListener("keydown", onKey);
    addEventListener("scroll", close, { passive: true, once: true });
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("scroll", close);
    };
  }, [open]);

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
      <div className="nav__end">
        <a className="btn btn--sm" href="#book">Забронировать</a>
        <button type="button" className="nav__burger" aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open} aria-controls="nav-menu" onClick={() => setOpen((o) => !o)}>
          <span /><span />
        </button>
      </div>
      {open && (
        <nav className="nav__menu" id="nav-menu" aria-label="Разделы">
          {MOBILE_LINKS.map(([href, title]) => <a key={href} href={href} onClick={() => setOpen(false)}>{title}</a>)}
        </nav>
      )}
    </header>
  );
}

