import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { dayMonth, money } from "../lib/format";
import { Mark } from "../components/Mark";
import WaitOverlay from "../components/booking/WaitOverlay";

const STATUS = {
  PENDING: "Ждёт подтверждения",
  CONFIRMED: "Подтверждена",
  CANCELLED: "Отменена",
};

/** Страница брони по ссылке из письма: детали и отмена по коду */
export default function BookingPage() {
  const { code } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    api(`/bookings/${code}`).then(setBooking).catch((e) => setError(e.status === 404 || e.status === 400 ? "Бронь не найдена — проверьте ссылку из письма." : e.error));
  }, [code]);

  const cancel = async () => {
    setWaiting(true);
    setMsg("");
    try {
      setBooking(await api(`/bookings/${code}/cancel`, { method: "POST" }));
      setMsg("Бронь отменена, время снова свободно. Письмо с подтверждением отмены уже в пути.");
    } catch (e) {
      setMsg(e.error);
    } finally {
      setWaiting(false);
    }
  };

  return (
    <main className="section booking-page">
      <div className="wrap">
        <Link className="booking-page__logo" to="/" aria-label="АРКА 123 — на главную">
          <Mark /> АРКА 123
        </Link>
        <div className="book">
          <div>
            <p className="eyebrow">Ваша бронь</p>
            <h1 className="h1" style={{ marginTop: 12 }}>
              {booking ? `${dayMonth(booking.date)}, ${booking.startTime.slice(0, 5)}–${booking.endTime.slice(0, 5)}` : error ? "Упс" : "Загружаем…"}
            </h1>
            <p className="lead" style={{ marginTop: 20 }}>Минск, ул. Мстиславца, 10, 2 этаж. Пройдите через арку с променада — наши окна смотрят на Национальную библиотеку.</p>
          </div>
          <div className="cal">
            {waiting && <WaitOverlay text="Отменяем бронь…" />}
            {error && <p className="cal__msg">{error}</p>}
            {booking && (
              <div className="bdone">
                <p className="eyebrow">{STATUS[booking.status]}</p>
                <p className="h2">{money(booking.totalPrice)}</p>
                <p className="bdone__text">
                  {booking.hours} ч · тариф «{booking.tariffName}» · {booking.guests} гостей
                  {booking.services.length > 0 && <><br />{booking.services.map((s) => s.name).join(", ")}</>}
                </p>
                <code className="bdone__code">{booking.code}</code>
                <div className="bdone__actions">
                  <Link className="btn btn--sun" to="/">На главную</Link>
                  {booking.status !== "CANCELLED" && (
                    <button className="btn btn--ghost bdone__cancel" type="button" onClick={cancel}>Отменить бронь</button>
                  )}
                </div>
                <p className="cal__msg" role="status">{msg}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
