import { useEffect, useRef, useState } from "react";
import { playMarkLoop } from "../../lib/markAnimation";
import { AnimatedMark } from "../Mark";

/** Ожидание ответа сервера: вторая часть ролика вместо спиннера, без видео — SVG-знак */
export default function WaitOverlay({ text }) {
  const videoRef = useRef(null);
  const markRef = useRef(null);
  const [noVideo, setNoVideo] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    video.currentTime = 0;
    video.play().catch(() => setNoVideo(true));
    return () => video.pause();
  }, []);

  useEffect(() => {
    if (noVideo && markRef.current) return playMarkLoop(markRef.current);
  }, [noVideo]);

  return (
    <div className="wait">
      {noVideo && <div className="wait-slot"><AnimatedMark ref={markRef} className="mark fb-mark" /></div>}
      <video ref={videoRef} className="wait-video" src="/assets/wait-loop.mp4" muted playsInline loop preload="auto" hidden={noVideo} />
      <p>{text}</p>
    </div>
  );
}
