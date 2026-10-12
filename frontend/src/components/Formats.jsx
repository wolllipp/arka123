import { FORMATS } from "../data/content";

export default function Formats() {
  return (
    <section className="section" id="formats">
      <div className="wrap">
        <h2 className="h1 reveal">Один зал. Любой&nbsp;формат.</h2>
        <div className="formats">
          {FORMATS.map((f) => (
            <article className="format reveal" key={f.title}>
              <div className="format__img"><img src={`/assets/img/${f.img}`} alt={f.alt} loading="lazy" /></div>
              <div className="format__meta"><h3 className="h3">{f.title}</h3><span className="format__cap">{f.cap}</span></div>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
