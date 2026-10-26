import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { money, SYM } from "../utils";
import { printInvoice } from "../print";

const BLANK = { customerName: "", customerAddress: "", customerPhone: "", customerGstin: "", orderNo: "", orderDate: "" };
const CUSTOMER_FIELDS = [
  ["customerName", "Customer / college name"], ["customerAddress", "Address"], ["customerPhone", "Phone"],
  ["customerGstin", "Customer GSTIN (optional)"], ["orderNo", "Order no."], ["orderDate", "Order date", "date"],
];

export default function NewBill({ notify }) {
  const [books, setBooks] = useState([]);
  const [c, setC] = useState(BLANK);
  const [rates, setRates] = useState({ USD: 59, GBP: 92, EUR: 74.2, DM: 38 });
  const [defDisc, setDefDisc] = useState(30);
  const [pick, setPick] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("cps");
  const [cart, setCart] = useState([]);

  const loadBooks = () => api("/books?limit=500").then((r) => setBooks(r.books)).catch((e) => notify(e.message));
  useEffect(() => { loadBooks(); }, []);

  const R = { INR: 1, ...rates };
  const net = (l) => l.price * (R[l.currency] || 0) * l.qty * (1 - l.disc / 100);

  const totals = useMemo(() => {
    const sub = cart.reduce((s, l) => s + net(l), 0);
    const gst = cart.reduce((s, l) => s + (net(l) * l.gstRate) / 100, 0);
    const raw = sub + gst, total = Math.round(raw);
    return { sub, gst, total, round: total - raw };
  }, [cart, rates]);

  const addLine = () => {
    const b = books.find((x) => x.title === pick);
    const n = Number(qty);
    if (!b) return notify("List mein se book chuno");
    if (!Number.isInteger(n) || n < 1) return notify("Quantity galat hai");
    const already = cart.filter((l) => l.book === b._id).reduce((s, l) => s + l.qty, 0);
    if (already + n > b.stock) return notify(`Stock sirf ${b.stock} hai`);
    setCart([...cart, { book: b._id, title: b.title, qty: n, unit: unit.trim() || "cps", currency: b.currency, price: b.listPrice, gstRate: b.gstRate, disc: Number(defDisc) || 0 }]);
    setPick(""); setQty(1);
  };

  const setDisc = (i, v) => setCart(cart.map((l, k) => (k === i ? { ...l, disc: Math.min(100, Math.max(0, Number(v) || 0)) } : l)));

  const save = async () => {
    if (!c.customerName.trim()) return notify("Customer ka naam likho");
    if (!cart.length) return notify("Bill mein koi book nahi hai");
    try {
      const inv = await api("/invoices", {
        method: "POST",
        body: { ...c, customerName: c.customerName.trim(), rates: R, items: cart.map(({ book, qty, unit, disc }) => ({ book, qty, unit, disc })) },
      });
      notify("Bill saved: " + inv.invoiceNo);
      printInvoice(inv);
      setCart([]); setC(BLANK); loadBooks();
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <>
      <div className="grid gap">
        {CUSTOMER_FIELDS.map(([k, label, type]) => (
          <label key={k}>{label}<input type={type || "text"} value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} /></label>
        ))}
      </div>
      <div className="grid gap">
        {["USD", "GBP", "EUR", "DM"].map((cur) => (
          <label key={cur}>{SYM[cur]} = Rs<input type="number" step="any" value={rates[cur]} onChange={(e) => setRates({ ...rates, [cur]: e.target.value })} /></label>
        ))}
        <label>Default discount %<input type="number" step="any" value={defDisc} onChange={(e) => setDefDisc(e.target.value)} /></label>
      </div>
      <div className="bar">
        <input className="grow" list="booklist" placeholder="Book ka naam type karo, phir list se chuno" value={pick} onChange={(e) => setPick(e.target.value)} />
        <datalist id="booklist">{books.map((b) => <option key={b._id} value={b.title} />)}</datalist>
        <input type="number" min="1" style={{ width: 80 }} value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Quantity" />
        <input style={{ width: 80 }} value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unit" />
        <button className="b" onClick={addLine}>Add to bill</button>
      </div>
      <div className="wrap">
        <table>
          <thead><tr><th>Book</th><th className="n">Qty</th><th>Cur</th><th className="n">Price</th><th className="n">Disc %</th><th className="n">Net (Rs)</th><th></th></tr></thead>
          <tbody>
            {cart.length === 0 && <tr><td colSpan="7" className="empty">Upar se book dhoondh ke bill mein jodo.</td></tr>}
            {cart.map((l, i) => (
              <tr key={i}>
                <td>{l.title}</td><td className="n">{l.qty} {l.unit}</td><td>{SYM[l.currency] || l.currency}</td><td className="n">{l.price}</td>
                <td className="n"><input type="number" step="any" min="0" max="100" style={{ width: 70 }} value={l.disc} onChange={(e) => setDisc(i, e.target.value)} aria-label="Discount %" /></td>
                <td className="n">{money(net(l))}</td>
                <td><button className="b d sm" onClick={() => setCart(cart.filter((_, k) => k !== i))}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="tot">Subtotal {money(totals.sub)} &nbsp; GST {money(totals.gst)} &nbsp; Round off {totals.round.toFixed(2)}<br />Total <b>{money(totals.total)}</b></div>
      <div className="bar end"><button className="b" onClick={save}>Save bill</button></div>
    </>
  );
}
