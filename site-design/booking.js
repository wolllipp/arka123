/* АРКА 123 — бронирование на сайте, подключено к arka-backend
   1) дни и часы — из /api/availability, 2) цена — /api/bookings/quote,
   3) бронь — POST /api/bookings, отмена — по коду брони */
(() => {
  const API = window.ARKA_API || "http://127.0.0.1:8090/api";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const DAYS_AHEAD = 14;
  const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const MONTHS_NOM = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

  const el = {
    days: $("#days"), slots: $("#slots"), month: $("#calMonth"),
    pickMsg: $("#pickMsg"), sumLabel: $("#sumLabel"), sumPrice: $("#sumPrice"), next: $("#bookBtn"),
    stepPick: $("#stepPick"), stepForm: $("#stepForm"), stepDone: $("#stepDone"),
    formWhen: $("#formWhen"), layout: $("#fLayout"), guests: $("#fGuests"), services: $("#fServices"),
    formMsg: $("#formMsg"), formTariff: $("#formTariff"), formPrice: $("#formPrice"), submit: $("#submitBtn"),
    wait: $("#bookWait"), waitText: $("#bookWaitText"),
  };

  const state = { catalog: null, date: null, slots: [], start: null, end: null, minHours: 2, booking: null };

  /* ---------- API ---------- */
  async function api(path, options = {}) {
    let res;
    try {
      res = await fetch(API + path, { headers: { "Content-Type": "application/json" }, ...options });
    } catch {
      throw { status: 0, error: "Сервер бронирования недоступен. Запустите arka-backend (порт 8090)." };
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, error: body.error || "Что-то пошло не так", fields: body.fields };
    return body;
  }

  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const hh = (h) => `${String(h).padStart(2, "0")}:00`;
  const money = (v) => `${Number(v).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} BYN`;
  const hoursWord = (n) => (n % 10 === 1 && n % 100 !== 11 ? "час" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "часа" : "часов");

  /* ---------- ожидание: вторая часть ролика вместо спиннера ---------- */
  let loop = null;
  const waitVideo = $("video", el.wait);
  async function withWait(text, task) {
    el.waitText.textContent = text;
    el.wait.hidden = false;
    waitVideo.hidden = false;
    waitVideo.currentTime = 0;
    waitVideo.play().catch(() => {
      waitVideo.hidden = true;
      loop = window.arkaSvgLoop?.(el.wait.querySelector(".wait-slot"));
    });
    // не мигаем: показываем ожидание хотя бы один цикл знака
    const minShow = new Promise((r) => setTimeout(r, 1400));
    try {
      const [result] = await Promise.all([task(), minShow]);
      return result;
    } finally {
      waitVideo.pause();
      loop?.stop();
      loop = null;
      el.wait.hidden = true;
    }
  }

  function show(step) {
    [el.stepPick, el.stepForm, el.stepDone].forEach((s) => (s.hidden = s !== step));
  }

  /* ---------- шаг 1: дни ---------- */
  async function loadDays() {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + DAYS_AHEAD - 1);
    try {
      const [catalog, days] = await Promise.all([
        state.catalog ? state.catalog : api("/catalog"),
        api(`/availability/calendar?from=${iso(from)}&to=${iso(to)}`),
      ]);
      state.catalog = catalog;
      state.minHours = catalog.minHours;
      renderDays(days);
      const first = days.find((d) => d.status === "FREE" || d.status === "PARTIAL");
      if (first) selectDay(first.date);
      else el.pickMsg.textContent = "На ближайшие две недели свободных окон нет — позвоните нам.";
    } catch (e) {
      el.month.textContent = "Календарь недоступен";
      el.pickMsg.textContent = e.error;
    }
  }

  function renderDays(days) {
    el.days.innerHTML = "";
    const months = new Set(days.map((d) => parse(d.date).getMonth()));
    el.month.textContent = [...months].map((m) => MONTHS_NOM[m]).join(" — ") + " " + parse(days[0].date).getFullYear();
    days.forEach((d) => {
      const date = parse(d.date);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "day" + (d.status === "FULL" || d.status === "CLOSED" ? " is-busy" : "");
      b.dataset.date = d.date;
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-label", `${date.getDate()} ${MONTHS[date.getMonth()]}, свободно ${d.freeHours} ч`);
      b.innerHTML = `${WD[date.getDay()]}<b>${date.getDate()}</b>`;
      b.addEventListener("click", () => selectDay(d.date));
      el.days.appendChild(b);
    });
  }

  /* ---------- шаг 1: часы ---------- */
  async function selectDay(date) {
    state.date = date;
    state.start = state.end = null;
    $$(".day", el.days).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.date === date)));
    el.pickMsg.textContent = "";
    try {
      const day = await api(`/availability?date=${date}`);
      state.slots = day.slots.map((s) => ({ hour: Number(s.start.slice(0, 2)), free: s.free }));
      renderSlots();
    } catch (e) {
      el.pickMsg.textContent = e.error;
    }
    updateSum();
  }

  function renderSlots() {
    el.slots.innerHTML = "";
    state.slots.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = hh(s.hour);
      b.dataset.hour = s.hour;
      b.className = "slot" + (s.free ? "" : " is-busy");
      b.disabled = !s.free;
      b.addEventListener("click", () => pickHour(s.hour));
      el.slots.appendChild(b);
    });
    paintRange();
  }

  /** Первый клик — начало, второй — последний час брони; между ними всё должно быть свободно */
  function pickHour(h) {
    if (state.start === null || state.end - state.start > 1 || h <= state.start) {
      state.start = h;
      state.end = h + 1;
    } else {
      const range = state.slots.filter((s) => s.hour >= state.start && s.hour <= h);
      if (range.every((s) => s.free)) {
        state.end = h + 1;
      } else {
        state.start = h;
        state.end = h + 1;
        el.pickMsg.textContent = "Между выбранными часами есть занятое время — начали заново.";
      }
    }
    paintRange();
    updateSum();
  }

  function paintRange() {
    $$(".slot", el.slots).forEach((b) => {
      const h = Number(b.dataset.hour);
      const on = state.start !== null && h >= state.start && h < state.end;
      b.classList.toggle("is-on", on);
      b.classList.toggle("is-edge", on && (h === state.start || h === state.end - 1));
    });
  }

  let quoteSeq = 0;
  async function updateSum() {
    const hours = state.start === null ? 0 : state.end - state.start;
    el.next.disabled = hours < state.minHours;
    if (!hours) {
      el.sumLabel.textContent = "Выберите время";
      el.sumPrice.textContent = "—";
      return;
    }
    const d = parse(state.date);
    el.sumLabel.textContent = `${d.getDate()} ${MONTHS[d.getMonth()]} · ${hh(state.start)}–${hh(state.end)} · ${hours} ${hoursWord(hours)}`;
    if (hours < state.minHours) {
      el.sumPrice.textContent = `минимум ${state.minHours} ч`;
      return;
    }
    const seq = ++quoteSeq;
    try {
      const q = await quote([]);
      if (seq === quoteSeq) el.sumPrice.textContent = money(q.total);
    } catch (e) {
      if (seq === quoteSeq) el.sumPrice.textContent = "—";
    }
  }

  function quote(services) {
    return api("/bookings/quote", {
      method: "POST",
      body: JSON.stringify({ startTime: hh(state.start), endTime: hh(state.end), guests: Number(el.guests.value) || 1, services }),
    });
  }

  /* ---------- шаг 2: форма ---------- */
  function fillForm() {
    const c = state.catalog;
    if (!el.layout.options.length) {
      c.layouts.forEach((l) => el.layout.add(new Option(`${l.title} · до ${l.capacity}`, l.code, l.code === "LECTURE", l.code === "LECTURE")));
      c.services.forEach((s) => {
        const chip = document.createElement("label");
        chip.className = "chip";
        chip.innerHTML = `<input type="checkbox" value="${s.code}" /><span>${s.name} <em data-price="${s.code}"></em></span>`;
        el.services.appendChild(chip);
      });
      el.stepForm.addEventListener("change", refreshFormPrice);
      el.guests.addEventListener("input", refreshFormPrice);
    }
    const d = parse(state.date);
    el.formWhen.textContent = `${d.getDate()} ${MONTHS[d.getMonth()]}, ${hh(state.start)}–${hh(state.end)}`;
    el.formMsg.textContent = "";
    refreshFormPrice();
  }

  const chosenServices = () => $$("input[type=checkbox]:checked", el.services).map((i) => i.value);

  let formSeq = 0;
  async function refreshFormPrice() {
    const seq = ++formSeq;
    try {
      const q = await quote(chosenServices());
      if (seq !== formSeq) return;
      el.formTariff.textContent = `Тариф «${q.tariffName}» · ${q.hours} ${hoursWord(q.hours)}`;
      el.formPrice.textContent = money(q.total);
      // подписи цен у услуг: «входит» для бесплатных в этом тарифе
      state.catalog.services.forEach((s) => {
        const line = q.services.find((l) => l.code === s.code);
        const included = line ? line.included : s.includedIn.includes(q.tariffCode);
        $(`[data-price="${s.code}"]`, el.services).textContent = included ? "входит" : s.perPerson ? `${money(s.price)}/чел.` : money(s.price);
      });
    } catch (e) {
      if (seq === formSeq) el.formMsg.textContent = e.error;
    }
  }

  el.next.addEventListener("click", () => {
    fillForm();
    show(el.stepForm);
    el.stepForm.querySelector("[name=contactName]").focus({ preventScroll: true });
  });
  $("#backBtn").addEventListener("click", () => show(el.stepPick));

  el.stepForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    $$("[aria-invalid]", el.stepForm).forEach((i) => i.removeAttribute("aria-invalid"));
    el.formMsg.textContent = "";
    const f = new FormData(el.stepForm);
    const payload = {
      date: state.date,
      startTime: hh(state.start),
      endTime: hh(state.end),
      layout: f.get("layout"),
      guests: Number(f.get("guests")),
      services: chosenServices(),
      contactName: f.get("contactName").trim(),
      contactPhone: f.get("contactPhone").trim(),
      contactEmail: f.get("contactEmail").trim() || null,
      comment: f.get("comment").trim() || null,
    };
    el.submit.disabled = true;
    try {
      const booking = await withWait("Проверяем свободное время…", () => api("/bookings", { method: "POST", body: JSON.stringify(payload) }));
      state.booking = booking;
      done(booking);
    } catch (err) {
      if (err.status === 409) {
        // слот успели занять — возвращаем к календарю с обновлёнными часами
        show(el.stepPick);
        await selectDay(state.date);
        el.pickMsg.textContent = err.error;
      } else {
        el.formMsg.textContent = err.error;
        Object.keys(err.fields || {}).forEach((name) => el.stepForm.querySelector(`[name=${name}]`)?.setAttribute("aria-invalid", "true"));
      }
    } finally {
      el.submit.disabled = false;
    }
  });

  /* ---------- шаг 3: результат ---------- */
  function done(b) {
    const d = parse(b.date);
    $("#doneTitle").textContent = `${d.getDate()} ${MONTHS[d.getMonth()]}, ${b.startTime.slice(0, 5)}–${b.endTime.slice(0, 5)} · ${money(b.totalPrice)}`;
    $("#doneCode").textContent = b.code;
    $("#doneMsg").textContent = "";
    $("#cancelBtn").hidden = false;
    show(el.stepDone);
  }

  $("#cancelBtn").addEventListener("click", async () => {
    try {
      await withWait("Отменяем бронь…", () => api(`/bookings/${state.booking.code}/cancel`, { method: "POST" }));
      $("#doneMsg").textContent = "Бронь отменена, время снова свободно.";
      $("#cancelBtn").hidden = true;
    } catch (e) {
      $("#doneMsg").textContent = e.error;
    }
  });

  $("#newBtn").addEventListener("click", () => {
    el.stepForm.reset();
    show(el.stepPick);
    loadDays();
  });

  loadDays();
})();
