export default function Place() {
  return (
    <section className="section" id="place" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <p className="eyebrow reveal">Как добраться</p>
        <h2 className="h1 reveal" style={{ marginTop: 12 }}>Пройдите через арку&nbsp;— и&nbsp;вы на&nbsp;месте.</h2>
        <div className="place">
          <div className="place__img reveal"><img src="/assets/img/p16.jpg" alt="Променад у здания на Мстиславца, 10" loading="lazy" /></div>
          <div className="place__card reveal">
            <div className="place__rows">
              <div><span className="eyebrow">Адрес</span><span className="h3">Минск, ул. Мстиславца, 10, 2 этаж</span></div>
              <div><span className="eyebrow">Ориентир</span><span>Два дома, соединённые аркой. С променада через арку видна Национальная библиотека — наши окна над ней.</span></div>
              <div><span className="eyebrow">Метро</span><span>«Восток» — 10 минут пешком</span></div>
            </div>
            <a className="btn" href="#book" style={{ alignSelf: "flex-start" }}>Забронировать зал</a>
          </div>
        </div>
      </div>
    </section>
  );
}
