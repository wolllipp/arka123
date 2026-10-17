import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { MONTHS_NOM, WEEKDAYS, dayMonth, hh, hoursWord, isoDate, money, parseDate } from "../../lib/format";
import WaitOverlay from "./WaitOverlay";
import { PHONE_DEFAULT, PHONE_EXAMPLE, isPhoneComplete, nextPhoneValue } from "../../lib/phone";
import { canCancelOnline, icsHref, onTariffChosen } from "../../lib/booking";
import { PHONE } from "../../data/content";
import ConfirmDialog from "../ConfirmDialog";

const DAYS_PAGE = 14; // календарь листается по две недели
const HORIZON_DAYS = 90; // как bookingHorizonDays в /catalog
const EMPTY_FORM = { layout: "LECTURE", guests: 10, services: [], contactName: "", contactPhone: PHONE_DEFAULT, contactEmail: "", comment: "" };

/** Ожидание показываем хотя бы ~один цикл знака, чтобы оверлей не мигал */
const atLeast = (promise, ms = 1400) => Promise.all([promise, new Promise((r) => setTimeout(r, ms))]).then(([v]) => v);

/**
 * Бронирование: 1) дата и часы из /api/availability, цена — /api/bookings/quote;
 * 2) формат, гости, услуги, контакты; 3) результат с кодом брони и отменой.
 */
export default function BookingWidget() {
  const [catalog, setCatalog] = useState(null);
  const [days, setDays] = useState([]);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [range, setRange] = useState(null); // { start, end } — end не включительно
  const [step, setStep] = useState("pick");
  const [form, setForm] = useState(EMPTY_FORM);
  const [quote, setQuote] = useState(null);
  const [invalid, setInvalid] = useState({});
  const [msg, setMsg] = useState({ pick: "", form: "", done: "" });
  const [wait, setWait] = useState(null);
  const [booking, setBooking] = useState(null);
  const [cancelled, setCancelled] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [page, setPage] = useState(0);
  const [preset, setPreset] = useState(null); // тариф из блока «Тарифы»: { title, hours }
  const [slow, setSlow] = useState(false); // бесплатный хостинг усыпляет API — первый ответ бывает через минуту
  const quoteSeq = useRef(0);

  const minHours = catalog?.minHours ?? 2;
  const lastPage = Math.floor(((catalog?.bookingHorizonDays ?? HORIZON_DAYS) - 1) / DAYS_PAGE);
  const hours = range ? range.end - range.start : 0;
  const say = (key, text) => setMsg((m) => ({ ...m, [key]: text }));

  /* ---------- дни ---------- */
  const selectDay = useCallback(async (d) => {
    setDate(d);
    setRange(null);
    say("pick", "");
    try {
      const day = await api(`/availability?date=${d}`);
      setSlots(day.slots.map((s) => ({ hour: Number(s.start.slice(0, 2)), free: s.free })));
    } catch (e) {
      setSlots([]);
      say("pick", e.error);
    }
  }, []);

  const loadDays = useCallback(async (pg) => {
    const from = new Date();
    from.setDate(from.getDate() + pg * DAYS_PAGE);
    const to = new Date(from);
    to.setDate(to.getDate() + DAYS_PAGE - 1);
    const limit = new Date();
    limit.setDate(limit.getDate() + HORIZON_DAYS - 1);
    try {
      const list = await api(`/availability/calendar?from=${isoDate(from)}&to=${isoDate(to < limit ? to : limit)}`);
      setDays(list);
      const first = list.find((d) => d.status === "FREE" || d.status === "PARTIAL");
      if (first) selectDay(first.date);
      else {
        setDate(null);
        setSlots([]);
        setRange(null);
        say("pick", "В эти две недели свободного времени нет — посмотрите следующие.");
      }
    } catch (e) {
      say("pick", e.error);
    }
  }, [selectDay]);

  useEffect(() => {
    if (days.length || msg.pick) return;
    const t = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(t);
  }, [days.length, msg.pick]);

  useEffect(() => {
    // первичная загрузка: каталог (форматы, услуги, правила) и первые две недели
    api("/catalog").then(setCatalog).catch((e) => say("pick", e.error));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDays(0);
  }, [loadDays]);

  const goPage = (pg) => {
    setPage(pg);
    loadDays(pg);
  };

  // «Выбрать» в тарифе — календарь сразу отмечает его длительность от нажатого часа
  useEffect(() => onTariffChosen((t) => {
    setPreset(t);
    setRange(null);
    setStep((s) => (s === "form" ? "pick" : s));
  }), []);

  /* ---------- часы: первый клик — начало, второй — последний час ---------- */
  const pickHour = (h) => {
    say("pick", "");
    if (!range || range.end - range.start > 1 || h <= range.start) {
      if (preset) {
        const span = slots.filter((s) => s.hour >= h && s.hour < h + preset.hours);
        if (span.length === preset.hours && span.every((s) => s.free)) {
          setRange({ start: h, end: h + preset.hours });
          return;
        }
        say("pick", `С ${hh(h)} нет ${preset.hours} ${hoursWord(preset.hours)} подряд — выберите начало раньше или отметьте последний час сами.`);
      }
      setRange({ start: h, end: h + 1 });
      return;
    }
    const between = slots.filter((s) => s.hour >= range.start && s.hour <= h);
    if (between.every((s) => s.free)) {
      setRange({ start: range.start, end: h + 1 });
    } else {
      setRange({ start: h, end: h + 1 });
      say("pick", "Между выбранными часами есть занятое время — начали заново.");
    }
  };

  /* ---------- цена считает сервер ---------- */
  const canQuote = range && hours >= minHours;
  useEffect(() => {
    if (!canQuote) return;
    const seq = ++quoteSeq.current;
    const services = step === "form" ? form.services : [];
    api("/bookings/quote", {
      method: "POST",
      body: JSON.stringify({ startTime: hh(range.start), endTime: hh(range.end), guests: Number(form.guests) || 1, services }),
    })
      .then((q) => seq === quoteSeq.current && setQuote(q))
      .catch((e) => seq === quoteSeq.current && (setQuote(null), say(step === "form" ? "form" : "pick", e.error)));
  }, [canQuote, range, step, form.services, form.guests]);
  // цена показывается только для актуального выбора
  const price = canQuote ? quote : null;

  /* ---------- шаг 2 ---------- */
  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setInvalid((i) => ({ ...i, [name]: false }));
  };
  const toggleService = (code) =>
    setField("services", form.services.includes(code) ? form.services.filter((c) => c !== code) : [...form.services, code]);

  const submit = async (e) => {
    e.preventDefault();
    say("form", "");
    setInvalid({});
    if (!isPhoneComplete(form.contactPhone)) {
      setInvalid({ contactPhone: true });
      say("form", "Введите номер полностью: +375 29 123-45-67");
      return;
    }
    const payload = {
      date,
      startTime: hh(range.start),
      endTime: hh(range.end),
      layout: form.layout,
      guests: Number(form.guests),
      services: form.services,
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim() || null,
      comment: form.comment.trim() || null,
    };
    setWait("Проверяем свободное время…");
    try {
      const created = await atLeast(api("/bookings", { method: "POST", body: JSON.stringify(payload) }));
      setBooking(created);
      setCancelled(false);
      say("done", "");
      setStep("done");
    } catch (err) {
      if (err.status === 409) {
        // слот успели занять — к календарю с обновлёнными часами
        setStep("pick");
        await selectDay(date);
        say("pick", err.error);
      } else {
        say("form", err.error);
        setInvalid(Object.fromEntries(Object.keys(err.fields || {}).map((k) => [k, true])));
      }
    } finally {
      setWait(null);
    }
  };

  /* ---------- шаг 3 ---------- */
  const cancel = async () => {
    setConfirmCancel(false);
    setWait("Отменяем бронь…");
    try {
      await atLeast(api(`/bookings/${booking.code}/cancel`, { method: "POST" }));
      setCancelled(true);
      say("done", "Бронь отменена, время снова свободно.");
    } catch (e) {
      say("done", e.error);
    } finally {
      setWait(null);
    }
  };

  const startOver = () => {
    setForm(EMPTY_FORM);
    setPreset(null);
    setStep("pick");
    loadDays(page);
  };

  const chosenLayout = catalog?.layouts.find((l) => l.code === form.layout);
  const overCapacity = !!chosenLayout && Number(form.guests) > chosenLayout.capacity;

  const monthTitle = days.length
    ? [...new Set(days.map((d) => parseDate(d.date).getMonth()))].map((m) => MONTHS_NOM[m]).join(" — ") + " " + parseDate(days[0].date).getFullYear()
    : msg.pick ? "Календарь недоступен" : slow ? "Сервер просыпается — это до минуты…" : "Загружаем календарь…";
  const when = range && date ? `${dayMonth(date)}, ${hh(range.start)}–${hh(range.end)}` : "";

  return (
    <div className="cal">
      {wait && <WaitOverlay text={wait} />}
      {confirmCancel && booking && (
        <ConfirmDialog
          title="Отменить бронь?"
          text={`${dayMonth(booking.date)}, ${booking.startTime.slice(0, 5)}–${booking.endTime.slice(0, 5)}. Время освободится, и его смогут забронировать другие.`}
          confirmLabel="Отменить бронь"
          onConfirm={cancel}
          onClose={() => setConfirmCancel(false)}
        />
      )}

      {step === "pick" && (
        <div className="step">
          <div className="cal__head">
            <div className="cal__nav">
              <button type="button" className="cal__arrow" aria-label="Предыдущие две недели" disabled={page === 0} onClick={() => goPage(page - 1)}>‹</button>
              <span>{monthTitle}</span>
              <button type="button" className="cal__arrow" aria-label="Следующие две недели" disabled={page >= lastPage} onClick={() => goPage(page + 1)}>›</button>
            </div>
            {preset ? (
              <span className="cal__hint">Тариф «{preset.title}»: нажмите час начала
                <button type="button" className="cal__reset" aria-label="Выбрать часы вручную" onClick={() => { setPreset(null); setRange(null); }}>×</button>
              </span>
            ) : (
              <span className="cal__hint">Нажмите первый и последний час</span>
            )}
          </div>
          <div className="days">
            {days.map((d) => {
              const dt = parseDate(d.date);
              const busy = d.status === "FULL" || d.status === "CLOSED";
              return (
                <button key={d.date} type="button" className={"day" + (busy ? " is-busy" : "")} aria-pressed={d.date === date} disabled={busy}
                  aria-label={`${dayMonth(d.date)}, свободно ${d.freeHours} ч`} onClick={() => selectDay(d.date)}>
                  {WEEKDAYS[dt.getDay()]}<b>{dt.getDate()}</b>
                </button>
              );
            })}
          </div>
          <div className="slots">
            {slots.map((s) => {
              const on = range && s.hour >= range.start && s.hour < range.end;
              const edge = on && (s.hour === range.start || s.hour === range.end - 1);
              return (
                <button key={s.hour} type="button" disabled={!s.free} onClick={() => pickHour(s.hour)}
                  className={"slot" + (s.free ? "" : " is-busy") + (on ? " is-on" : "") + (edge ? " is-edge" : "")}>
                  {hh(s.hour)}
                </button>
              );
            })}
          </div>
          <p className="cal__msg" role="status">{msg.pick}</p>
          <div className="cal__sum">
            <div>
              <span className="cal__sum-label">{hours ? `${when.replace(",", " ·")} · ${hours} ${hoursWord(hours)}` : "Выберите время"}</span><br />
              <strong>{!hours ? "—" : hours < minHours ? `минимум ${minHours} ч` : price ? money(price.total) : "…"}</strong>
            </div>
            <button className="btn btn--sun" type="button" disabled={hours < minHours} onClick={() => { say("form", ""); setStep("form"); }}>Продолжить</button>
          </div>
        </div>
      )}

      {step === "form" && catalog && (
        <form className="step bform" noValidate onSubmit={submit}>
          <button type="button" className="bform__back" onClick={() => setStep("pick")}>← {when}</button>
          <label className="bform__guests">Гостей
            <input type="number" min="1" inputMode="numeric" value={form.guests} onChange={(e) => setField("guests", e.target.value)} aria-invalid={invalid.guests || undefined} />
          </label>
          {/* формат — карточки-переключатели в стиле чипов и дней календаря; не вмещающие гостей недоступны */}
          <fieldset className="opts" aria-invalid={invalid.layout || overCapacity || undefined}>
            <legend>Формат</legend>
            {catalog.layouts.map((l) => {
              const fits = Number(form.guests) <= l.capacity;
              return (
                <label className="opt" key={l.code}>
                  <input type="radio" name="layout" value={l.code} checked={form.layout === l.code}
                    disabled={!fits && form.layout !== l.code} onChange={() => setField("layout", l.code)} />
                  <span>
                    <b>{l.title}</b>
                    <small>до {l.capacity} гостей</small>
                  </span>
                </label>
              );
            })}
          </fieldset>
          {overCapacity && <p className="cal__msg">Выбранный формат вмещает до {chosenLayout.capacity} гостей — уменьшите число гостей или выберите другой.</p>}
          <fieldset className="bform__services">
            <legend>Дополнительно</legend>
            {catalog.services.map((s) => {
              const line = price?.services.find((l) => l.code === s.code);
              const included = line ? line.included : price ? s.includedIn.includes(price.tariffCode) : false;
              return (
                <label className="chip" key={s.code}>
                  <input type="checkbox" checked={form.services.includes(s.code)} onChange={() => toggleService(s.code)} />
                  <span>{s.name} <em>{included ? "входит" : s.perPerson ? `${money(s.price)}/чел.` : money(s.price)}</em></span>
                </label>
              );
            })}
          </fieldset>
          <div className="bform__row">
            <label>Имя<input autoFocus={matchMedia("(pointer: fine)").matches} autoComplete="name" value={form.contactName} onChange={(e) => setField("contactName", e.target.value)} aria-invalid={invalid.contactName || undefined} /></label>
            <label>Телефон
              <span className="phone">
                <input type="tel" inputMode="tel" autoComplete="tel" value={form.contactPhone}
                  onChange={(e) => setField("contactPhone", nextPhoneValue(form.contactPhone, e.target.value))} aria-invalid={invalid.contactPhone || undefined} />
                {/* оставшаяся часть примера — светлым поверх поля, сдвигается вслед за вводом */}
                <span className="phone__ghost" aria-hidden="true">
                  <span className="phone__typed">{form.contactPhone}</span>{PHONE_EXAMPLE.slice(form.contactPhone.length)}
                </span>
              </span>
            </label>
          </div>
          <label><span>Email <span className="bform__opt">пришлём подтверждение и напоминание</span></span>
            <input type="email" autoComplete="email" required value={form.contactEmail} onChange={(e) => setField("contactEmail", e.target.value)} aria-invalid={invalid.contactEmail || undefined} />
          </label>
          <label><span>Комментарий <span className="bform__opt">необязательно</span></span>
            <textarea rows="2" value={form.comment} onChange={(e) => setField("comment", e.target.value)} />
          </label>
          <p className="cal__msg" role="alert">{msg.form}</p>
          <div className="cal__sum">
            <div>
              <span className="cal__sum-label">{price ? `Тариф «${price.tariffName}» · ${price.hours} ${hoursWord(price.hours)}` : "Тариф"}</span><br />
              <strong>{price ? money(price.total) : "—"}</strong>
            </div>
            <button className="btn btn--sun" type="submit" disabled={!!wait || overCapacity}>Забронировать</button>
          </div>
        </form>
      )}

      {step === "done" && booking && (
        <div className="step bdone">
          <p className="eyebrow">{cancelled ? "Бронь отменена" : "Заявка принята"}</p>
          <p className="h2">{`${dayMonth(booking.date)}, ${booking.startTime.slice(0, 5)}–${booking.endTime.slice(0, 5)} · ${money(booking.totalPrice)}`}</p>
          <p className="bdone__text">Письмо с деталями и ссылкой на бронь отправили на <b>{booking.contactEmail}</b>. Подтвердим в течение 15 минут по телефону.</p>
          <code className="bdone__code">{booking.code}</code>
          {!cancelled && (
            <div className="bdone__actions">
              <Link className="btn btn--sun" to={`/booking/${booking.code}`}>Открыть бронь</Link>
              <a className="btn btn--ghost bdone__cancel" href={icsHref(booking, `${location.origin}/booking/${booking.code}`)} download="arka123.ics">Добавить в календарь</a>
            </div>
          )}
          <p className="cal__msg" role="status">{msg.done}</p>
          <div className="bdone__links">
            {!cancelled && (canCancelOnline(booking)
              ? <button className="bdone__link" type="button" onClick={() => setConfirmCancel(true)}>Отменить бронь</button>
              : <span>До начала меньше суток — отменить можно по телефону <a href={PHONE.href}>{PHONE.text}</a></span>)}
            <button className="bdone__link" type="button" onClick={startOver}>Новая бронь</button>
          </div>
        </div>
      )}
    </div>
  );
}
