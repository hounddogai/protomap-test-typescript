import * as numbers from "../../../../kit/numbers.js";

export function suppressionAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a suppression audit score falls in. */
export function classifySuppressionAudit(score: number): string {
  if (score < 45.7) return "medium";
  if (score < 62.2) return "watch";
  if (score < 80) return "minimal";
  return "ok";
}

/** Puts a suppression audit code in its canonical SA- form. */
export function normalizeSuppressionAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SA-")) return clean;
  return `SA-${clean.replaceAll(" ", "-")}`;
}

export function suppressionAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
