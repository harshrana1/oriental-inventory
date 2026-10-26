import { useEffect, useState } from "react";
import { hasToken, setToken, setUnauthorizedHandler } from "./api";
import Login from "./pages/Login";
import Books from "./pages/Books";
import NewBill from "./pages/NewBill";
import Bills from "./pages/Bills";

const TABS = { books: ["Books", Books], bill: ["New bill", NewBill], bills: ["Bills", Bills] };

export default function App() {
  const [loggedIn, setLoggedIn] = useState(hasToken());
  const [tab, setTab] = useState("books");
  const [toast, setToast] = useState("");

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  // api.js ko 401 mile to login screen dikhao
  useEffect(() => setUnauthorizedHandler(() => setLoggedIn(false)), []);

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const Page = TABS[tab][1];
  return (
    <>
      <header>
        <h1>Oriental Inventory</h1>
        <nav>
          {Object.entries(TABS).map(([key, [label]]) => (
            <button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>{label}</button>
          ))}
        </nav>
        <button className="logout" onClick={() => { setToken(null); setLoggedIn(false); }}>Logout</button>
      </header>
      <main><Page notify={notify} /></main>
      {toast && <div id="toast">{toast}</div>}
    </>
  );
}
