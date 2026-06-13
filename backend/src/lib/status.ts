export type TrafficStatus = "green" | "yellow" | "red";

export function calcStatus(
  actual: number,
  target: number,
  greenThreshold = 95,
  yellowThreshold = 80
): TrafficStatus {
  if (target <= 0) return "green";
  const pct = (actual / target) * 100;
  if (pct >= greenThreshold) return "green";
  if (pct >= yellowThreshold) return "yellow";
  return "red";
}

export function pctToTarget(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((actual / target) * 1000) / 10;
}

export function overallStatus(statuses: TrafficStatus[]): TrafficStatus {
  if (statuses.length === 0) return "green";
  if (statuses.some((s) => s === "red")) return "red";
  if (statuses.some((s) => s === "yellow")) return "yellow";
  return "green";
}
