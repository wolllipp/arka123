import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getSession, login } from "../admin/auth";
import { Mark } from "../components/Mark";
import "../styles/admin.css";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (getSession()) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="alogin">
      <form className="alogin__card" onSubmit={submit}>
        <div className="alogin__brand"><Mark /> АРКА 123</div>
        <h1 className="h2">Вход для администратора</h1>
        <label className="afield">Email
          <input type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="afield">Пароль
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <p className="amsg" role="alert">{error}</p>
        <button className="btn" type="submit" disabled={busy}>{busy ? "Входим…" : "Войти"}</button>
      </form>
    </main>
  );
}
