/* Общее для виджета брони и страницы брони по ссылке */

/** Гость отменяет онлайн не позднее чем за сутки — как app.booking.free-cancel-hours на бэкенде */
export const FREE_CANCEL_HOURS = 24;

const startsAt = (b) => new Date(`${b.date}T${b.startTime.slice(0, 5)}`);

export const canCancelOnline = (b) =>
  b.status !== "CANCELLED" && startsAt(b) - Date.now() > FREE_CANCEL_HOURS * 3600e3;

export const guestsWord = (n) =>
  n % 10 === 1 && n % 100 !== 11 ? "гость" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "гостя" : "гостей";

/* ---------- тариф из блока «Тарифы» → длительность в календаре ---------- */
const TARIFF_EVENT = "arka:tariff";

export const chooseTariff = (t) => dispatchEvent(new CustomEvent(TARIFF_EVENT, { detail: { title: t.title, hours: t.hours } }));

export function onTariffChosen(fn) {
  const handler = (e) => fn(e.detail);
  addEventListener(TARIFF_EVENT, handler);
  return () => removeEventListener(TARIFF_EVENT, handler);
}

/* ---------- «Добавить в календарь»: .ics, время — минское ---------- */
const icsTime = (date, time) => date.replaceAll("-", "") + "T" + time.slice(0, 5).replace(":", "") + "00";
const icsText = (s) => s.replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");

export function icsHref(b, pageUrl) {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ARKA 123//Booking//RU",
    "BEGIN:VEVENT",
    `UID:${b.code}@arka123`,
    `DTSTART;TZID=Europe/Minsk:${icsTime(b.date, b.startTime)}`,
    `DTEND;TZID=Europe/Minsk:${icsTime(b.date, b.endTime)}`,
    `SUMMARY:${icsText("АРКА 123 — аренда зала")}`,
    `LOCATION:${icsText("Минск, ул. Мстиславца, 10, 2 этаж")}`,
    `DESCRIPTION:${icsText(`Бронь ${b.startTime.slice(0, 5)}–${b.endTime.slice(0, 5)}. Детали и отмена: ${pageUrl}`)}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n"));
}
