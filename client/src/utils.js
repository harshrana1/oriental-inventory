export const SYM = { INR: "Rs", USD: "$", GBP: "£", EUR: "€", DM: "DM" };

export const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const below100 = (x) => (x < 20 ? ONES[x] : TENS[Math.floor(x / 10)] + (x % 10 ? " " + ONES[x % 10] : ""));
const below1000 = (x) => (x > 99 ? ONES[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " : "") : "") + (x % 100 ? below100(x % 100) : "");

// Indian system: Crore, Lakh, Thousand
export function words(num) {
  let n = Math.round(num);
  if (!n) return "Zero";
  let s = "";
  for (const [q, name] of [[1e7, "Crore"], [1e5, "Lakh"], [1e3, "Thousand"]]) {
    if (n >= q) { s += below1000(Math.floor(n / q)) + " " + name + " "; n %= q; }
  }
  return (s + (n ? below1000(n) : "")).trim();
}
