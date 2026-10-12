import { EXTRAS, TARIFFS } from "../data/content";

export default function Tariffs() {
  return (
    <section className="section tariffs-sec" id="tariffs">
      <div className="wrap">
        <p className="eyebrow reveal">Тарифы</p>
        <h2 className="h1 reveal" style={{ marginTop: 12 }}>Платите за время, а не за лишнее.</h2>
        <div className="tariffs">
          {TARIFFS.map((t) => (
            <article className={"tariff reveal" + (t.main ? " tariff--main" : "")} key={t.title}>
              {t.main && <span className="tariff__badge">Чаще всего</span>}
              <h3 className="h3">{t.title}</h3>
              <p className="muted">{t.sub}</p>
              <div className="tariff__price">{t.price}<small>{t.unit}</small></div>
              <p className="muted">{t.note}</p>
              <ul>{t.items.map((i) => <li key={i}>{i}</li>)}</ul>
              <a className={t.main ? "btn" : "btn btn--ghost"} href="#book">{t.cta}</a>
            </article>
          ))}
        </div>

        <div className="extras">
          <div className="reveal">
            <h2 className="h2">Услуги и цены</h2>
            <p className="muted" style={{ marginTop: 12 }}>Добавьте к любому тарифу при бронировании.</p>
          </div>
          <div className="reveal">
            <ul className="price-list">
              {EXTRAS.map(([name, note, price]) => <li key={name}><b>{name}</b><span>{note}</span><em>{price}</em></li>)}
            </ul>
            <p className="note">Цены в макете — ориентировочные, финальные согласуем с заказчиком.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
