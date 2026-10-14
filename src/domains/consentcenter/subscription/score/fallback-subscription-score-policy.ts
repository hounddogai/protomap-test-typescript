import * as numbers from "../../../../kit/numbers.js";

export function fallbackSubscriptionScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function fallbackSubscriptionScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a fallback subscription score code in its canonical FSS- form. */
export function normalizeFallbackSubscriptionScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FSS-")) return clean;
  return `FSS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a fallback subscription score score falls in. */
export function classifyFallbackSubscriptionScore(score: number): string {
  if (score < 4) return "critical";
  if (score < 24.9) return "medium";
  if (score < 37.6) return "low";
  if (score < 73.8) return "watch";
  return "elevated";
}
