const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8090/api";

/** fetch к arka-backend; ошибки приходят как { status, error, fields } */
export async function api(path, options = {}) {
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
