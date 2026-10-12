import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { adminApi, clearSession, getSession } from "../admin/auth";
import { isoDate, money, parseDate } from "../lib/format";
import { Mark } from "../components/Mark";
import StatusBadge from "../components/admin/StatusBadge";
import BookingDrawer from "../components/admin/BookingDrawer";
import ConfirmDialog from "../components/admin/ConfirmDialog";
import "../styles/admin.css";

const STATUSES = [
  { id: "", title: "Все" },
  { id: "PENDING", title: "Ждут" },
  { id: "CONFIRMED", title: "Подтверждены" },
  { id: "CANCELLED", title: "Отменены" },
];
const PERIODS = [
  { id: "upcoming", title: "Предстоящие" },
  { id: "today", title: "Сегодня" },
  { id: "week", title: "Неделя" },
  { id: "all", title: "Всё время" },
];
const REFRESH_MS = 30_000;

function periodRange(id) {
  const today = new Date();
  const week = new Date();
  week.setDate(week.getDate() + 6);
  if (id === "today") return { from: isoDate(today), to: isoDate(today) };
  if (id === "week") return { from: isoDate(today), to: isoDate(week) };
  if (id === "upcoming") return { from: isoDate(today) };
  return {};
}

const dayTitle = (s) => {
  const d = parseDate(s);
  const t = d.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export default function AdminPage() {
  const navigate = useNavigate();
  const session = getSession();
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [bookings, setBookings] = useState(null);
  const [stats, setStats] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const toastTimer = useRef(null);

  const onAuthError = useCallback((e) => {
    if (e.status === 401 || e.status === 403) navigate("/admin/login", { replace: true });
    else setError(e.error);
  }, [navigate]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ ...periodRange(period), ...(status && { status }), ...(query.trim() && { q: query.trim() }) });
    try {
      const [list, s] = await Promise.all([adminApi(`/bookings?${params}`), adminApi("/bookings/stats")]);
      setBookings(list);
      setStats(s);
      setError("");
      setUpdatedAt(new Date());
    } catch (e) {
      onAuthError(e);
    }
  }, [period, status, query, onAuthError]);

  // загрузка при смене фильтров (поиск — с небольшой задержкой) и автообновление, пока вкладка видна
  useEffect(() => {
    const t = setTimeout(load, query ? 250 : 0);
    const timer = setInterval(() => document.visibilityState === "visible" && load(), REFRESH_MS);
    return () => {
      clearTimeout(t);
      clearInterval(timer);
    };
  }, [load, query]);

  const showToast = (text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  };

  const act = async (booking, action) => {
    setBusy(true);
    try {
      await adminApi(`/bookings/${booking.id}/${action}`, { method: "POST" });
      showToast(action === "confirm" ? "Бронь подтверждена — гостю ушло письмо" : "Бронь отменена — гостю ушло письмо");
      await load();
    } catch (e) {
      if (e.status === 401 || e.status === 403) onAuthError(e);
      else showToast(e.error);
    } finally {
      setBusy(false);
      setConfirmCancel(null);
    }
  };

  const groups = useMemo(() => {
    const map = new Map();
    (bookings || []).forEach((b) => map.set(b.date, [...(map.get(b.date) || []), b]));
    return [...map.entries()];
  }, [bookings]);

  if (!session) return <Navigate to="/admin/login" replace />;
  const open = bookings?.find((b) => b.id === openId);

  const logout = () => {
    clearSession();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin">
      <header className="abar">
        <div className="abar__brand"><Mark /> АРКА 123 <span>· Администратор</span></div>
        <div className="abar__right">
          <span className="amuted">{session.email}</span>
          <button className="btn btn--ghost btn--sm" type="button" onClick={logout}>Выйти</button>
        </div>
      </header>

      <main className="admin__main">
        <div className="admin__title">
          <h1 className="h1">Брони</h1>
          <span className="amuted">{updatedAt ? `обновлено в ${updatedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "загружаем…"}</span>
        </div>

        <section className="atiles" aria-label="Сводка">
          <button type="button" className={"atile" + (stats?.pending ? " atile--accent" : "")} onClick={() => { setStatus("PENDING"); setPeriod("upcoming"); }}>
            <span>Ждут подтверждения</span><strong>{stats?.pending ?? "—"}</strong>
          </button>
          <button type="button" className="atile" onClick={() => { setStatus(""); setPeriod("today"); }}>
            <span>Сегодня</span><strong>{stats?.today ?? "—"}</strong>
          </button>
          <button type="button" className="atile" onClick={() => { setStatus(""); setPeriod("week"); }}>
            <span>На неделе</span><strong>{stats?.week ?? "—"}</strong>
          </button>
          <div className="atile atile--static">
            <span>Выручка недели · подтверждённые</span><strong>{stats ? money(stats.weekRevenue) : "—"}</strong>
          </div>
        </section>

        <div className="afilters">
          <div className="aseg" role="group" aria-label="Статус">
            {STATUSES.map((s) => <button key={s.id} type="button" aria-pressed={status === s.id} onClick={() => setStatus(s.id)}>{s.title}</button>)}
          </div>
          <div className="aseg" role="group" aria-label="Период">
            {PERIODS.map((p) => <button key={p.id} type="button" aria-pressed={period === p.id} onClick={() => setPeriod(p.id)}>{p.title}</button>)}
          </div>
          <label className="asearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input type="search" placeholder="Имя, телефон или email" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Поиск" />
          </label>
        </div>

        {error && <p className="amsg">{error}</p>}

        {bookings && groups.length === 0 && (
          <div className="aempty"><Mark /><p>Броней по этим фильтрам нет.</p></div>
        )}

        {groups.map(([date, list]) => (
          <section className="aday" key={date}>
            <h2 className="aday__title">{dayTitle(date)} <span>{list.length}</span></h2>
            <ul className="alist">
              {list.map((b) => (
                <li key={b.id} className={"arow" + (b.status === "CANCELLED" ? " arow--cancelled" : "") + (b.id === openId ? " is-open" : "")}>
                  <button type="button" className="arow__main" onClick={() => setOpenId(b.id)}>
                    <span className="arow__time"><b>{b.startTime.slice(0, 5)}–{b.endTime.slice(0, 5)}</b><small>{b.hours} ч</small></span>
                    <span className="arow__who"><b>{b.contactName}</b><small>{b.contactPhone}{b.contactEmail ? ` · ${b.contactEmail}` : ""}</small></span>
                    <span className="arow__what"><small>{b.guests} гостей · {b.tariffName}{b.services.length ? ` · +${b.services.length} усл.` : ""}</small></span>
                    <span className="arow__sum">{money(b.totalPrice)}</span>
                    <StatusBadge status={b.status} />
                  </button>
                  <span className="arow__actions">
                    {b.status === "PENDING" && <button className="btn btn--sun btn--sm" type="button" disabled={busy} onClick={() => act(b, "confirm")}>Подтвердить</button>}
                    {b.status !== "CANCELLED" && <button className="btn btn--ghost btn--sm" type="button" disabled={busy} onClick={() => setConfirmCancel(b)}>Отменить</button>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      {open && <BookingDrawer booking={open} busy={busy} onClose={() => setOpenId(null)} onConfirm={(b) => act(b, "confirm")} onCancel={(b) => setConfirmCancel(b)} />}

      {confirmCancel && (
        <ConfirmDialog
          title="Отменить бронь?"
          text={`${confirmCancel.contactName}, ${dayTitle(confirmCancel.date).toLowerCase()}, ${confirmCancel.startTime.slice(0, 5)}–${confirmCancel.endTime.slice(0, 5)}. Время освободится, гость получит письмо об отмене.`}
          confirmLabel="Отменить бронь"
          onConfirm={() => act(confirmCancel, "cancel")}
          onClose={() => setConfirmCancel(null)}
        />
      )}

      <div className={"atoast" + (toast ? " is-on" : "")} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
