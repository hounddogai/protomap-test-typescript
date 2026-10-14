import * as numbers from "../../../../kit/numbers.js";

/** Puts a subscription cycle code in its canonical SC- form. */
export function normalizeSubscriptionCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SC-")) return clean;
  return `SC-${clean.replaceAll(" ", "-")}`;
}

export function subscriptionCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a subscription cycle score falls in. */
export function classifySubscriptionCycle(score: number): string {
  if (score < 25.9) return "critical";
  if (score < 29.6) return "ok";
  if (score < 56.6) return "elevated";
  if (score < 81.4) return "high";
  return "minimal";
}

export function subscriptionCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
