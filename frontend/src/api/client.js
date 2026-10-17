import { PHONE } from "../data/content";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8090/api";

/** fetch к arka-backend; ошибки приходят как { status, error, fields } */
export async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(API + path, { headers: { "Content-Type": "application/json" }, ...options });
  } catch {
    throw { status: 0, error: `Не получилось связаться с сервером бронирования. Обновите страницу через минуту или позвоните нам: ${PHONE.text}.` };
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, error: body.error || "Что-то пошло не так", fields: body.fields };
  return body;
}
