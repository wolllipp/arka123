export const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
export const MONTHS_NOM = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
export const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

/** Дата → 2026-10-15 по локальному времени (toISOString сдвинул бы в UTC) */
export const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const hh = (h) => `${String(h).padStart(2, "0")}:00`;
export const money = (v) => `${Number(v).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} BYN`;
export const hoursWord = (n) =>
  n % 10 === 1 && n % 100 !== 11 ? "час" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "часа" : "часов";
export const dayMonth = (s) => {
  const d = parseDate(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
