import { REVIEWS } from "../data/content";

export default function Reviews() {
  return (
    <section className="section" id="reviews" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <h2 className="h1 reveal">Возвращаются со следующей группой.</h2>
        <div className="reviews">
          {REVIEWS.map((r) => (
            <figure className={"review reveal" + (r.big ? " review--big" : "")} key={r.name}>
              <blockquote>{r.text}</blockquote>
              <figcaption className="review__who"><span className="avatar">{r.initials}</span><div><b>{r.name}</b><span>{r.event}</span></div></figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
