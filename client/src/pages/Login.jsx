import { useState } from "react";
import { api, setToken } from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const r = await api("/auth/login", { method: "POST", body: { username: username.trim(), password } });
      setToken(r.token);
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <h2>Oriental Inventory</h2>
        <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        {error && <p className="err">{error}</p>}
        <button className="b">Login</button>
      </form>
    </div>
  );
}
