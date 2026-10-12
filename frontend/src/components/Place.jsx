import PlaceMap from "./PlaceMap";

export default function Place() {
  return (
    <section className="section" id="place" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <h2 className="h1 reveal">Пройдите через арку&nbsp;— и&nbsp;вы на&nbsp;месте.</h2>
        <div className="place">
          <PlaceMap />
          <div className="place__card reveal">
            <div className="place__rows">
              <div><span className="eyebrow">Адрес</span><span className="h3">Минск, ул. Мстиславца, 10, 2 этаж</span></div>
              <div><span className="eyebrow">Ориентир</span><span>Два дома, соединённые аркой. С променада через арку видна Национальная библиотека — наши окна над ней.</span></div>
              <div><span className="eyebrow">Метро</span><span>«Восток» — 6&nbsp;минут пешком, около 500&nbsp;м по&nbsp;пунктиру на карте</span></div>
            </div>
            <div className="place__actions">
              <a className="btn" href="#book">Забронировать зал</a>
              <a className="btn btn--ghost" href="https://yandex.by/maps/?rtext=~53.93078,27.65021&rtt=auto" target="_blank" rel="noreferrer">Построить маршрут</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
