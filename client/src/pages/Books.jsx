import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { money } from "../utils";

const FIELDS = [
  ["title", "Title *"], ["author", "Author"], ["publisher", "Publisher"], ["edition", "Edition"],
  ["subject", "Subject"], ["language", "Language"], ["itemType", "Item type"], ["isbn", "ISBN"],
  ["pages", "Pages", "number"], ["volumes", "Volumes"], ["hsn", "HSN"], ["gstRate", "GST %", "number"],
  ["currency", "Currency (INR/USD/GBP/EUR/DM)"], ["listPrice", "List price *", "number"],
  ["stock", "Stock", "number"], ["lowStockLimit", "Low stock limit", "number"],
];
const DEFAULTS = { language: "English", itemType: "Book", hsn: "4901", gstRate: 0, currency: "INR", stock: 0, lowStockLimit: 5 };

function BookForm({ book, onClose, onSaved, notify }) {
  const isEdit = !!book._id;
  const [f, setF] = useState(isEdit ? book : DEFAULTS);

  const submit = async (e) => {
    e.preventDefault();
    const body = {};
    FIELDS.forEach(([k, , type]) => {
      const v = f[k];
      if (v !== "" && v != null) body[k] = type === "number" ? Number(v) : String(v).trim();
    });
    try {
      await api(isEdit ? `/books/${book._id}` : "/books", { method: isEdit ? "PUT" : "POST", body });
      notify(isEdit ? "Book updated" : "Book added");
      onSaved();
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <div className="overlay">
      <form className="card modal" onSubmit={submit}>
        <h2>{isEdit ? "Edit book" : "Add book"}</h2>
        <div className="grid">
          {FIELDS.map(([k, label, type]) => (
            <label key={k}>{label}
              <input type={type || "text"} step="any" required={label.includes("*")} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </label>
          ))}
        </div>
        <div className="bar end">
          <button type="button" className="b g" onClick={onClose}>Cancel</button>
          <button className="b">Save book</button>
        </div>
      </form>
    </div>
  );
}

export default function Books({ notify }) {
  const [books, setBooks] = useState([]);
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [form, setForm] = useState(null); // null = band, {} = nayi book, book = edit

  const load = useCallback(async () => {
    try {
      const data = lowOnly ? await api("/books/low-stock") : (await api(`/books?limit=500&search=${encodeURIComponent(q.trim())}`)).books;
      setBooks(data);
    } catch (err) {
      notify(err.message);
    }
  }, [q, lowOnly]);

  // typing ke 250ms baad hi search (har akshar pe server ko tang nahi karte)
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const changeStock = async (b, sign) => {
    const n = Number(prompt(sign > 0 ? "Kitni copies aayi?" : "Kitni copies bikin?", "1"));
    if (!n) return;
    try {
      await api(`/books/${b._id}/stock`, { method: "PATCH", body: { change: sign * n } });
      notify("Stock updated");
      load();
    } catch (err) {
      notify(err.message);
    }
  };

  const remove = async (b) => {
    if (!confirm(`"${b.title}" delete karni hai?`)) return;
    try {
      await api(`/books/${b._id}`, { method: "DELETE" });
      notify("Deleted");
      load();
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <>
      <div className="bar">
        <input className="grow" placeholder="Search title, author, ISBN" value={q} onChange={(e) => { setLowOnly(false); setQ(e.target.value); }} />
        <button className="b g" onClick={() => setLowOnly(!lowOnly)}>{lowOnly ? "Show all" : "Low stock only"}</button>
        <button className="b" onClick={() => setForm({})}>Add book</button>
      </div>
      <div className="wrap">
        <table>
          <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th className="n">Price</th><th className="n">GST %</th><th className="n">Stock</th><th></th></tr></thead>
          <tbody>
            {books.length === 0 && <tr><td colSpan="7" className="empty">Koi book nahi mili.</td></tr>}
            {books.map((b) => (
              <tr key={b._id} className={b.stock <= b.lowStockLimit ? "low" : ""}>
                <td>{b.title}</td><td>{b.author}</td><td>{b.isbn}</td>
                <td className="n">{money(b.listPrice)}</td><td className="n">{b.gstRate}</td><td className="n st">{b.stock}</td>
                <td>
                  <button className="b g sm" onClick={() => changeStock(b, 1)}>+</button>{" "}
                  <button className="b g sm" onClick={() => changeStock(b, -1)}>−</button>{" "}
                  <button className="b g sm" onClick={() => setForm(b)}>Edit</button>{" "}
                  <button className="b d sm" onClick={() => remove(b)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {form && <BookForm book={form} notify={notify} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </>
  );
}
