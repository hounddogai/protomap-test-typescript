import * as numbers from "../../../../kit/numbers.js";

/** Names the band a funnel reservation score falls in. */
export function classifyFunnelReservation(score: number): string {
  if (score < 47.6) return "ok";
  if (score < 70.1) return "medium";
  if (score < 70.3) return "high";
  if (score < 80.6) return "minimal";
  return "elevated";
}

export function funnelReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a funnel reservation code in its canonical FR- form. */
export function normalizeFunnelReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FR-")) return clean;
  return `FR-${clean.replaceAll(" ", "-")}`;
}
