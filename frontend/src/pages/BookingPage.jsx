import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { dayMonth, money } from "../lib/format";
import { Mark } from "../components/Mark";
import WaitOverlay from "../components/booking/WaitOverlay";
import ConfirmDialog from "../components/ConfirmDialog";
import { canCancelOnline, guestsWord, icsHref } from "../lib/booking";
import { PHONE } from "../data/content";

const STATUS = {
  PENDING: "Ждёт подтверждения",
  CONFIRMED: "Подтверждена",
  CANCELLED: "Отменена",
};

/** Страница брони по ссылке (с экрана успеха или из письма): детали и отмена по коду */
export default function BookingPage() {
  const { code } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [layouts, setLayouts] = useState({});

  useEffect(() => {
    api(`/bookings/${code}`).then(setBooking).catch((e) => setError(e.status === 404 || e.status === 400 ? "Бронь не найдена — проверьте ссылку или код брони." : e.error));
    // названия форматов рассадки — из каталога, как в форме брони
    api("/catalog").then((c) => setLayouts(Object.fromEntries(c.layouts.map((l) => [l.code, l.title])))).catch(() => {});
  }, [code]);

  const cancel = async () => {
    setConfirming(false);
    setWaiting(true);
    setMsg("");
    try {
      setBooking(await api(`/bookings/${code}/cancel`, { method: "POST" }));
      setMsg("Бронь отменена, время снова свободно.");
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
            {confirming && (
              <ConfirmDialog
                title="Отменить бронь?"
                text={`${dayMonth(booking.date)}, ${booking.startTime.slice(0, 5)}–${booking.endTime.slice(0, 5)}. Время освободится, и его смогут забронировать другие.`}
                confirmLabel="Отменить бронь"
                onConfirm={cancel}
                onClose={() => setConfirming(false)}
              />
            )}
            {error && <p className="cal__msg">{error}</p>}
            {booking && (
              <div className="bdone">
                <p className="eyebrow">{STATUS[booking.status]}</p>
                <p className="h2">{money(booking.totalPrice)}</p>
                <p className="bdone__text">
                  {booking.hours} ч · тариф «{booking.tariffName}» · {booking.guests} {guestsWord(booking.guests)}
                  {layouts[booking.layout] && <> · {layouts[booking.layout].toLowerCase()}</>}
                  {booking.services.length > 0 && <><br />{booking.services.map((s) => s.name).join(", ")}</>}
                  <br />На имя {booking.contactName}, {booking.contactPhone}
                </p>
                {booking.status === "PENDING" && <p className="bdone__text">Администратор подтвердит бронь по телефону в течение 15 минут в рабочее время.</p>}
                <code className="bdone__code">{booking.code}</code>
                <div className="bdone__actions">
                  {booking.status !== "CANCELLED" && (
                    <a className="btn btn--sun" href={icsHref(booking, location.href)} download="arka123.ics">Добавить в календарь</a>
                  )}
                  <Link className="btn btn--ghost bdone__cancel" to="/">На главную</Link>
                </div>
                <p className="cal__msg" role="status">{msg}</p>
                {booking.status !== "CANCELLED" && (
                  <div className="bdone__links">
                    {canCancelOnline(booking)
                      ? <button className="bdone__link" type="button" onClick={() => setConfirming(true)}>Отменить бронь</button>
                      : <span>До начала меньше суток — отменить можно по телефону <a href={PHONE.href}>{PHONE.text}</a></span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
