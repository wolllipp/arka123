import { api } from "../api/client";

const KEY = "arka.admin";

/** Сессия администратора: JWT из /api/auth/login (живёт 3 часа) */
export function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!s?.token) return null;
    // срок жизни — из самого токена (exp в секундах)
    const exp = JSON.parse(atob(s.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).exp;
    if (exp && exp * 1000 < Date.now()) {
      clearSession();
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // приватный режим — сессия и так не сохранится
  }
}

export async function login(email, password) {
  const res = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  if (res.role !== "ADMIN") throw { status: 403, error: "У этого аккаунта нет прав администратора" };
  try {
    localStorage.setItem(KEY, JSON.stringify({ token: res.token, name: res.name, email: res.email }));
  } catch {
    // без localStorage вход проживёт до перезагрузки
  }
  return res;
}

/** Запрос к /api/admin/** с токеном; на 401/403 сессия сбрасывается */
export async function adminApi(path, options = {}) {
  const session = getSession();
  if (!session) throw { status: 401, error: "Нужно войти" };
  try {
    return await api("/admin" + path, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
    });
  } catch (e) {
    if (e.status === 401 || e.status === 403) clearSession();
    throw e;
  }
}
