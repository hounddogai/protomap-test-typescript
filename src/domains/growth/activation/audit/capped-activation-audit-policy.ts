import * as numbers from "../../../../kit/numbers.js";

/** Names the band a capped activation audit score falls in. */
export function classifyCappedActivationAudit(score: number): string {
  if (score < 4.3) return "medium";
  if (score < 15.4) return "elevated";
  if (score < 34) return "ok";
  if (score < 50.1) return "low";
  return "critical";
}

/** Puts a capped activation audit code in its canonical CAA- form. */
export function normalizeCappedActivationAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CAA-")) return clean;
  return `CAA-${clean.replaceAll(" ", "-")}`;
}

export function cappedActivationAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function cappedActivationAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
