/* АРКА 123 — анимации страницы (GSAP + ScrollTrigger) */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  if (!window.gsap) {
    document.documentElement.classList.add("no-js");
    $("#preloader")?.remove();
    return;
  }
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  /* ---------- после заставки всегда начинаем с первого экрана ----------
     браузер при обновлении восстанавливает прежнюю позицию или прыгает к #якорю —
     под прелоадером этого не видно, и сайт «открывался с середины» */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  ScrollTrigger.clearScrollMemory("manual");
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  scrollTo(0, 0);
  addEventListener("load", () => scrollTo(0, 0), { once: true });

  /* ---------- знак: анимация из ролика «в стиле Apple» ----------
     Кривая прорисовки снята с ролика покадрово (доля нарисованной линии
     во времени): уголок появляется сразу, линия долго разгоняется,
     быстро обходит свод и мягко дотягивается по основанию к «1». */
  const LINE_CURVE = [
    [0, 0.041], [0.095, 0.044], [0.143, 0.047], [0.19, 0.058], [0.238, 0.074], [0.286, 0.095],
    [0.333, 0.124], [0.381, 0.163], [0.429, 0.211], [0.476, 0.268], [0.524, 0.336], [0.571, 0.418],
    [0.619, 0.512], [0.667, 0.617], [0.714, 0.708], [0.762, 0.78], [0.81, 0.839], [0.857, 0.886],
    [0.905, 0.936], [0.952, 0.975], [1, 1],
  ];
  const lineEase = (u) => {
    for (let i = 1; i < LINE_CURVE.length; i++) {
      const [u1, p1] = LINE_CURVE[i];
      if (u <= u1) {
        const [u0, p0] = LINE_CURVE[i - 1];
        return p0 + ((p1 - p0) * (u - u0)) / (u1 - u0);
      }
    }
    return 1;
  };
  // k — множитель скорости (1 = как в ролике)
  function markTimeline(svg, k = 1) {
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

  /* ---------- запасной вариант без видео ----------
     в режиме энергосбережения Safari блокирует автозапуск даже беззвучного видео —
     тогда тот же знак рисуется SVG-анимацией (кривая снята с ролика) */
  function svgMark(host) {
    const svg = $("#navMark").cloneNode(true);
    svg.removeAttribute("id");
    svg.classList.add("fb-mark");
    host.appendChild(svg);
    return svg;
  }
  function svgLoop(host) {
    const svg = svgMark(host);
    const tl = markTimeline(svg, 0.8);
    tl.to(svg, { opacity: 0, duration: 0.3, ease: "power1.in" }, "+=0.6").set(svg, { opacity: 1 });
    tl.repeat(-1).play();
    return { stop: () => { tl.kill(); svg.remove(); } };
  }

  /* ---------- прелоадер ----------
     часть 1 ролика (intro.mp4, ×1.25) играет при загрузке и сама уходит в белый;
     если страница ещё не готова — включается часть 2 (wait-loop.mp4) по кругу */
  const pre = $("#preloader");
  const vid = $("#plVideo");
  const wait = $("#plWait");
  gsap.set(".hero__title .line > span", { yPercent: 110 });
  gsap.set(".reveal-hero", { opacity: 0, y: 16 });

  let ready = document.readyState === "complete";
  const pageReady = new Promise((r) => (ready ? r() : addEventListener("load", () => { ready = true; r(); }, { once: true })));
  const introDone = new Promise((r) => {
    if (reduce) return r();
    vid.addEventListener("ended", r);
    vid.addEventListener("error", r);
    vid.play().catch(() => {
      // автоплей заблокирован — рисуем знак кодом и идём дальше
      vid.style.display = "none";
      const svg = svgMark(pre);
      const tl = markTimeline(svg, 0.8);
      tl.to(svg, { opacity: 0, duration: 0.35, ease: "power1.in" }, "+=0.5").eventCallback("onComplete", r);
      tl.play();
    });
    setTimeout(r, 7000);
  });
  introDone.then(() => {
    if (ready || reduce) return;
    vid.style.opacity = 0;
    wait.style.opacity = 1;
    wait.play().catch(() => {
      wait.style.display = "none";
      const loop = svgLoop(pre);
      pageReady.then(loop.stop);
    });
  });

  Promise.all([pageReady, introDone]).then(() => {
    gsap.timeline()
      .to(pre, { opacity: 0, duration: 0.35, ease: "power1.out" })
      .add(() => { vid.pause(); wait.pause(); pre.remove(); })
      .to(".hero__title .line > span", { yPercent: 0, duration: 1.0, ease: "expo.out", stagger: 0.08 }, 0.1)
      .to(".reveal-hero", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, 0.4);
  });

  /* ---------- окно раскрывается на скролле (pin + scrub) ---------- */
  if (!reduce) {
    const mm = gsap.matchMedia();
    mm.add(
      { desk: "(min-width: 761px)", mob: "(max-width: 760px)" },
      (ctx) => {
        const side = ctx.conditions.desk ? 31 : 8;
        const r = ctx.conditions.desk ? 18 : 42;
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "#window", start: "top top", end: "+=130%", scrub: 0.6, pin: true },
        });
        tl.fromTo(
          "#windowFrame",
          { clipPath: `inset(0% ${side}% 8% ${side}% round ${r}vw ${r}vw 0vw 0vw)` },
          { clipPath: "inset(0% 0% 0% 0% round 0vw 0vw 0vw 0vw)", ease: "none", duration: 1 }
        )
          .fromTo("#windowFrame img", { scale: 1.18 }, { scale: 1, ease: "none", duration: 1 }, 0)
          .fromTo("#windowCaption", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.72);
      }
    );
  }

  /* ---------- плавная прокрутка к разделам по ссылкам-якорям ---------- */
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      const y = target === 0 ? 0 : target.getBoundingClientRect().top + scrollY - 84; // отступ под шапку
      const dist = Math.abs(y - scrollY);
      gsap.to(window, {
        scrollTo: { y, autoKill: true }, // любой скролл пользователя прерывает анимацию
        duration: reduce ? 0 : gsap.utils.clamp(0.6, 1.4, dist / 2500),
        ease: "power3.inOut",
      });
    })
  );

  /* ---------- навигация: прячется при скролле вниз, темнеет над 3D ---------- */
  const nav = $("#nav");
  let lastY = scrollY;
  addEventListener(
    "scroll",
    () => {
      const y = scrollY;
      nav.classList.toggle("is-hidden", y > lastY && y > 400);
      lastY = y;
    },
    { passive: true }
  );
  ScrollTrigger.create({
    trigger: "#room",
    start: "top 40px",
    end: "bottom 40px",
    toggleClass: { targets: nav, className: "is-dark" },
  });

  /* ---------- появление блоков ---------- */
  if (!reduce) {
    gsap.set(".reveal", { y: 28 });
    ScrollTrigger.batch(".reveal", {
      start: "top 88%",
      once: true,
      onEnter: (els) =>
        gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.07, overwrite: true }),
    });
  } else {
    gsap.set(".reveal", { opacity: 1 });
  }

  /* ---------- счётчики ---------- */
  $$("[data-count]").forEach((el) => {
    const to = +el.dataset.count;
    const small = el.querySelector("small");
    const write = (v) => {
      el.firstChild.nodeValue = Math.round(v);
      if (small) el.appendChild(small);
    };
    if (reduce) return write(to);
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: "expo.out", onUpdate: () => write(o.v) }),
    });
  });

  /* ---------- ховер на логотипе: знак перерисовывается (вторая часть ролика) ---------- */
  const navMark = $("#navMark");
  const hoverTl = markTimeline(navMark, 0.6);
  hoverTl.progress(1);
  if (matchMedia("(hover: hover)").matches && !reduce) {
    $(".nav__logo").addEventListener("mouseenter", () => {
      if (!hoverTl.isActive()) hoverTl.restart();
    });
  }

  /* ---------- сегменты рассадки в 3D ---------- */
  const seg = $("#layoutSeg");
  const pill = $(".seg__pill", seg);
  const segBtns = $$("button", seg);
  const placePill = (btn) => {
    pill.style.width = btn.offsetWidth + "px";
    pill.style.translate = btn.offsetLeft + "px 0";
  };
  segBtns.forEach((b) =>
    b.addEventListener("click", () => {
      segBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      placePill(b);
      dispatchEvent(new CustomEvent("arka:layout", { detail: b.dataset.layout }));
    })
  );
  const placeActive = () => placePill(segBtns.find((b) => b.getAttribute("aria-pressed") === "true"));
  document.fonts?.ready.then(placeActive);
  addEventListener("resize", placeActive);
  placeActive();

  /* ---------- галерея: стрелки + перетаскивание ---------- */
  const track = $("#galleryTrack");
  $$(".gallery__nav button").forEach((b) =>
    b.addEventListener("click", () => track.scrollBy({ left: +b.dataset.dir * track.clientWidth * 0.6, behavior: "smooth" }))
  );
  let drag = null;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
    track.style.scrollSnapType = "none";
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    track.scrollLeft = drag.left - dx;
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null;
    track.style.scrollSnapType = "";
  };
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  // бронирование живёт в booking.js — отдаём ему общий запасной лоадер
  window.arkaSvgLoop = svgLoop;
})();
