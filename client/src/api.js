const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let token = localStorage.getItem("token");
let onUnauthorized = () => {};

export const hasToken = () => !!token;
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);
export function setToken(t) {
  token = t;
  t ? localStorage.setItem("token", t) : localStorage.removeItem("token");
}

export async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new Error("Server nahi mila. Backend chalu hai?");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    setToken(null);
    onUnauthorized(); // login screen wapas
  }
  if (!res.ok) throw new Error(data.error || "Kuch galat hua");
  return data;
}
