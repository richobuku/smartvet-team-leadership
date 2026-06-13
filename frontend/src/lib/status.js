export function calcStatus(actual, target, greenThreshold = 95, yellowThreshold = 80) {
  if (!target || target <= 0) return "green";
  const pct = (actual / target) * 100;
  if (pct >= greenThreshold) return "green";
  if (pct >= yellowThreshold) return "yellow";
  return "red";
}
