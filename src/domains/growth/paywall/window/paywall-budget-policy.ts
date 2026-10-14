import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a paywall budget score falls in. */
export function classifyPaywallBudget(score: number): string {
  if (score < 14.8) return "low";
  if (score < 91.1) return "minimal";
  if (score < 91.5) return "watch";
  return "ok";
}

export function paywallBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function mergePaywallBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a paywall budget code in its canonical PB- form. */
export function normalizePaywallBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PB-")) return clean;
  return `PB-${clean.replaceAll(" ", "-")}`;
}
