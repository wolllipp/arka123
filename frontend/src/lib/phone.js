/* Белорусский номер: +375 XX XXX-XX-XX — 2 цифры кода оператора и 7 цифр номера */

export const PHONE_PREFIX = "+375 ";
export const PHONE_DEFAULT = PHONE_PREFIX; // код оператора у всех разный — вводит сам человек
/** Пример, который светлым «дописывается» за введённой частью */
export const PHONE_EXAMPLE = "+375 29 123-45-67";
const LOCAL_DIGITS = 9;

/** Цифры после +375; понимает вставку в любом виде: +375 29…, 375 29…, 80 29…, 29… */
export function phoneDigits(value) {
  let d = value.replace(/\D/g, "");
  if (d.startsWith("375")) d = d.slice(3);
  else if (d.startsWith("80") && d.length > LOCAL_DIGITS) d = d.slice(2);
  return d.slice(0, LOCAL_DIGITS);
}

export function formatPhone(digits) {
  const d = digits.slice(0, LOCAL_DIGITS);
  let out = PHONE_PREFIX + d.slice(0, 2);
  if (d.length >= 2) out += " ";
  if (d.length > 2) out += d.slice(2, 5);
  if (d.length > 5) out += "-" + d.slice(5, 7);
  if (d.length > 7) out += "-" + d.slice(7, 9);
  return out;
}

/** Новое значение поля после ввода; если стёрли только разделитель — стираем и цифру перед ним */
export function nextPhoneValue(prev, raw) {
  let digits = phoneDigits(raw);
  if (raw.length < prev.length && digits === phoneDigits(prev)) digits = digits.slice(0, -1);
  return formatPhone(digits);
}

export const isPhoneComplete = (value) => phoneDigits(value).length === LOCAL_DIGITS;
