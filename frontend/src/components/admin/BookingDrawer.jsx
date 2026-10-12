import { useEffect } from "react";
import { dayMonth, money } from "../../lib/format";
import StatusBadge from "./StatusBadge";

const LAYOUT = { EMPTY: "Свободная планировка", LECTURE: "Лекция рядами", TABLE: "Общий стол", GROUPS: "Группы" };

/** Карточка брони — панель справа; фон не затемняем: список рядом остаётся живым */
export default function BookingDrawer({ booking: b, onClose, onConfirm, onCancel, busy }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);

  const created = new Date(b.createdAt);
  return (
    <aside className="adrawer" aria-label="Бронь">
      <div className="adrawer__head">
        <StatusBadge status={b.status} />
        <button className="around" type="button" aria-label="Закрыть" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <h2 className="h2">{dayMonth(b.date)}, {b.startTime.slice(0, 5)}–{b.endTime.slice(0, 5)}</h2>
      <p className="amuted">{b.hours} ч · тариф «{b.tariffName}» · {LAYOUT[b.layout]} · {b.guests} гостей</p>

      <dl className="adl">
        <div><dt>Гость</dt><dd>{b.contactName}</dd></div>
        <div><dt>Телефон</dt><dd><a href={`tel:${b.contactPhone.replace(/[^+\d]/g, "")}`}>{b.contactPhone}</a></dd></div>
        {b.contactEmail && <div><dt>Email</dt><dd><a href={`mailto:${b.contactEmail}`}>{b.contactEmail}</a></dd></div>}
        <div><dt>Услуги</dt><dd>{b.services.length ? b.services.map((s) => `${s.name}${Number(s.price) === 0 ? " (входит)" : ` — ${money(s.price)}`}`).join(", ") : "—"}</dd></div>
        {b.comment && <div><dt>Комментарий</dt><dd>{b.comment}</dd></div>}
        <div><dt>Итого</dt><dd className="adl__total">{money(b.totalPrice)}</dd></div>
        <div><dt>Создана</dt><dd>{created.toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</dd></div>
        <div><dt>Код</dt><dd><code>{b.code}</code></dd></div>
      </dl>

      <div className="adrawer__actions">
        {b.status === "PENDING" && <button className="btn btn--sun" type="button" disabled={busy} onClick={() => onConfirm(b)}>Подтвердить</button>}
        {b.status !== "CANCELLED" && <button className="btn btn--ghost" type="button" disabled={busy} onClick={() => onCancel(b)}>Отменить бронь</button>}
      </div>
    </aside>
  );
}
