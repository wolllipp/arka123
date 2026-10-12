import BookingWidget from "./booking/BookingWidget";
import CharacterPortrait from "./CharacterPortrait";

export default function Booking() {
  return (
    <section className="section" id="book" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="book reveal">
          <div>
            <p className="eyebrow">Бронирование</p>
            <h2 className="h1" style={{ marginTop: 12 }}>Выберите дату — остальное мы.</h2>
            <p className="lead" style={{ marginTop: 20 }}>Свободные слоты видны сразу. Бронь подтверждаем в течение 15 минут, оплата — после подтверждения.</p>
            <CharacterPortrait />
          </div>
          <BookingWidget />
        </div>
      </div>
    </section>
  );
}
