import { useEffect, useRef, useState } from "react";
import { gsap, reduceMotion } from "../lib/gsap";
import { markTimeline, playMarkLoop } from "../lib/markAnimation";
import { AnimatedMark } from "./Mark";

/* Часть 1 ролика (intro.mp4, ×1.25) играет при загрузке и сама уходит в белый;
   если страница ещё не готова — по кругу крутится часть 2 (wait-loop.mp4).
   Если автозапуск видео заблокирован — тот же знак рисуется SVG-анимацией. */
export default function Preloader({ onDone }) {
  const rootRef = useRef(null);
  const introRef = useRef(null);
  const waitRef = useRef(null);
  const markRef = useRef(null);
  const [fallback, setFallback] = useState(null); // null | "intro" | "loop"
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduce = reduceMotion();
    const intro = introRef.current;
    const wait = waitRef.current;
    let ready = document.readyState === "complete";
    let stopLoop = null;
    let cancelled = false;

    const pageReady = new Promise((r) => {
      if (ready) return r();
      addEventListener("load", () => { ready = true; r(); }, { once: true });
    });
    const introDone = new Promise((r) => {
      if (reduce) return r();
      intro.addEventListener("ended", r, { once: true });
      intro.addEventListener("error", r, { once: true });
      intro.play().catch(() => setFallback({ kind: "intro", done: r }));
      setTimeout(r, 7000);
    });
    introDone.then(() => {
      if (ready || reduce || cancelled) return;
      intro.style.opacity = 0;
      wait.style.opacity = 1;
      wait.play().catch(() => setFallback({ kind: "loop", done: (stop) => (stopLoop = stop) }));
    });

    Promise.all([pageReady, introDone]).then(() => {
      if (cancelled) return;
      gsap.to(rootRef.current, {
        opacity: 0,
        duration: 0.35,
        ease: "power1.out",
        onComplete: () => {
          intro.pause();
          wait.pause();
          stopLoop?.();
          setGone(true);
        },
      });
      onDone?.();
    });
    return () => { cancelled = true; };
    // onDone вызывается один раз за загрузку страницы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SVG-знак вместо заблокированного видео
  useEffect(() => {
    if (!fallback || !markRef.current) return;
    const svg = markRef.current;
    if (fallback.kind === "intro") {
      const tl = markTimeline(svg, 0.8);
      tl.to(svg, { opacity: 0, duration: 0.35, ease: "power1.in" }, "+=0.5").eventCallback("onComplete", fallback.done);
      tl.play();
      return () => tl.kill();
    }
    const stop = playMarkLoop(svg);
    fallback.done(stop);
    return stop;
  }, [fallback]);

  if (gone) return null;
  return (
    <div className="preloader" ref={rootRef} aria-hidden="true">
      <video ref={introRef} src="/assets/intro.mp4" muted playsInline autoPlay preload="auto" style={fallback ? { display: "none" } : undefined} />
      <video ref={waitRef} className="wait-video" src="/assets/wait-loop.mp4" muted playsInline loop preload="auto" />
      {fallback && <AnimatedMark ref={markRef} className="mark fb-mark" />}
    </div>
  );
}
