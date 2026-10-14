import * as numbers from "../../../../kit/numbers.js";

/** Puts a regional model audit code in its canonical RMA- form. */
export function normalizeRegionalModelAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RMA-")) return clean;
  return `RMA-${clean.replaceAll(" ", "-")}`;
}

export function regionalModelAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a regional model audit score falls in. */
export function classifyRegionalModelAudit(score: number): string {
  if (score < 57.8) return "high";
  if (score < 86.6) return "ok";
  return "low";
}

/** Counts how many amounts fit in a budget of 13310.0, in order. */
export function regionalModelAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 13310) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
