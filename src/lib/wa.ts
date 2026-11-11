export function normalizePhone(p: string) {
  const d = (p || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  if (d.startsWith("8")) return "62" + d;
  return d;
}

export function waLink(phone: string, text: string) {
  const n = normalizePhone(phone);
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export function openWa(phone: string, text: string) {
  if (typeof window === "undefined") return;
  window.open(waLink(phone, text), "_blank", "noopener");
}

export const displayPhone = (p: string) => {
  const d = (p || "").replace(/\D/g, "");
  const local = d.startsWith("62") ? "0" + d.slice(2) : d;
  return local.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
};
