import { SYM, money, esc, words } from "./utils";

// Yahan apni dukaan ki details badlo (bank aur GSTIN khali hai)
const SHOP = {
  name: "Oriental Enterprises",
  tag: "Publishers, Book Distributors & Printers",
  addr: "31-B (2nd Floor), Rajpur Road, Dehradun-248001, Uttarakhand, India",
  ph: "0135-2654218, 09412992872",
  pan: "ABAPS9758A",
  gstin: "",
  bank: "Bank name, branch aur A/c No. yahan likho",
};

export function printInvoice(v) {
  const w = window.open("", "_blank");
  if (!w) return alert("Pop-up allow karo, tab print khulega");
  const d = (x) => new Date(x).toLocaleDateString("en-IN");
  const r = v.rates || {};
  const rows = v.items.map((i, k) => `<tr><td>${k + 1}</td><td>${esc(i.title)}${i.author ? " : " + esc(i.author) : ""}</td><td class="n">${i.qty} ${esc(i.unit)}</td><td>${SYM[i.currency] || ""}</td><td class="n">${i.conv}</td><td class="n">${i.price}</td><td class="n">${money(i.price * i.conv * i.qty)}</td><td class="n">${i.disc}%</td><td class="n">${money(i.amount)}</td></tr>`).join("");
  w.document.write(`<title>${v.invoiceNo}</title><style>body{font:13px system-ui;margin:28px;color:#111}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #999;padding:4px 6px;text-align:left}.n{text-align:right}h1{font:600 26px Georgia,serif;margin:0}.c{text-align:center}</style>
<div class="c"><h1>${SHOP.name}</h1>${SHOP.tag}<br>${SHOP.addr}<br>Ph: ${SHOP.ph}${SHOP.gstin ? "<br>GSTIN: " + SHOP.gstin : ""}</div><hr>
<b>INVOICE # ${v.invoiceNo}</b> &nbsp; Dated ${d(v.date)}<br>To: <b>${esc(v.customerName)}</b><br>${esc(v.customerAddress || "")}${v.customerPhone ? "<br>Ph: " + esc(v.customerPhone) : ""}${v.customerGstin ? "<br>GSTIN: " + esc(v.customerGstin) : ""}${v.orderNo ? "<br>Your Order No. " + esc(v.orderNo) + (v.orderDate ? " dated " + d(v.orderDate) : "") : ""}
<table><tr><th>Sr.</th><th>Particulars</th><th class="n">Qty</th><th>Cur.</th><th class="n">GOC</th><th class="n">Rate</th><th class="n">Price Rs.P</th><th class="n">Disc %</th><th class="n">Net Price</th></tr>${rows}</table>
<p class="n">Total ${money(v.subtotal)}<br>${v.gstTotal ? "GST " + money(v.gstTotal) + " (CGST " + money(v.gstTotal / 2) + " + SGST " + money(v.gstTotal / 2) + ")<br>" : ""}Round off ${(v.roundOff || 0).toFixed(2)}<br><b style="font-size:17px">Net payable ${money(v.total)}</b></p>
<p>(Rupees ${words(v.total)} Only)</p>
<p>Certified that publishers' price has been charged &amp; conversion rates are as per GOC: $ = Rs ${r.USD}, £ = Rs ${r.GBP}, € = Rs ${r.EUR}.<br>PAN No. ${SHOP.pan}<br>Payment by Bankers Cheque / Electronic fund transfer favouring "${SHOP.name}". ${SHOP.bank}</p>
<p class="n" style="margin-top:50px">For ${SHOP.name}<br><br>Manager</p><script>onload=()=>print()<\/script>`);
  w.document.close();
}
