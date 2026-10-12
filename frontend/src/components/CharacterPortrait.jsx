import { useState } from "react";

const SRC = "/assets/character/mstislav-portrait.jpg";

/** Мстислав — фирменный персонаж (задание 2). Пока файла нет — блок не показывается */
export default function CharacterPortrait() {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <figure className="hero-cat">
      <div className="hero-cat__img">
        <img src={SRC} alt="Мстислав — серый кот с брошью АРКА 123 на подоконнике напротив Библиотеки" loading="lazy" onError={() => setOk(false)} />
      </div>
      <figcaption>
        <b>Мстислав</b>
        <span>хранитель зала. Встретит у арки и проводит к окну с видом на Библиотеку.</span>
      </figcaption>
    </figure>
  );
}
