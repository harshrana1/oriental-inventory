import { useEffect, useState } from "react";
import { api } from "../api";
import { money } from "../utils";
import { printInvoice } from "../print";

export default function Bills({ notify }) {
  const [bills, setBills] = useState([]);
  useEffect(() => { api("/invoices").then(setBills).catch((e) => notify(e.message)); }, []);

  return (
    <div className="wrap">
      <table>
        <thead><tr><th>No.</th><th>Date</th><th>Customer</th><th className="n">Total</th><th></th></tr></thead>
        <tbody>
          {bills.length === 0 && <tr><td colSpan="5" className="empty">Abhi koi bill nahi hai.</td></tr>}
          {bills.map((v) => (
            <tr key={v._id}>
              <td>{v.invoiceNo}</td><td>{new Date(v.date).toLocaleDateString("en-IN")}</td><td>{v.customerName}</td>
              <td className="n">{money(v.total)}</td>
              <td><button className="b g sm" onClick={() => printInvoice(v)}>Print</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
