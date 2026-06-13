export const STATUS_COLORS = {
  green: { bg: "bg-statusGreen", text: "text-statusGreen", light: "bg-statusGreen/10", label: "On Track" },
  yellow: { bg: "bg-statusYellow", text: "text-statusYellow", light: "bg-statusYellow/10", label: "Needs Attention" },
  red: { bg: "bg-statusRed", text: "text-statusRed", light: "bg-statusRed/10", label: "Urgent" },
};

export function pctToTarget(actual, target) {
  if (!target) return 0;
  return Math.round((actual / target) * 1000) / 10;
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function isoDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatMonth(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatNumber(value, unit) {
  if (unit === "USD") return `$${Number(value).toLocaleString()}`;
  if (unit === "%") return `${value}%`;
  if (unit === "stars") return `${value}★`;
  return Number(value).toLocaleString();
}
