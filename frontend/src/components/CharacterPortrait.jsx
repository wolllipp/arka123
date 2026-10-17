import { useState } from "react";

const SRC = "/assets/character/mstislav-cutout.webp"; // вырезан из фона, прозрачный

/** Мстислав — фирменный персонаж (задание 2). Пока файла нет — блок не показывается */
export default function CharacterPortrait() {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <figure className="hero-cat">
      <div className="hero-cat__img">
        <img src={SRC} alt="Мстислав — дымчато-серый кот с кулоном-аркой «123» на ошейнике" loading="lazy" onError={() => setOk(false)} />
      </div>
      <figcaption>
        <b>Мстислав</b>
        <span>хранитель зала. Встретит у арки и проводит к окну с видом на Библиотеку.</span>
      </figcaption>
    </figure>
  );
}
