import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback bid rule snapshot score falls in. */
export function classifyFallbackBidRuleSnapshot(score: number): string {
  if (score < 14.6) return "low";
  if (score < 42.7) return "watch";
  return "critical";
}

/** Puts a fallback bid rule snapshot code in its canonical FBRS- form. */
export function normalizeFallbackBidRuleSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FBRS-")) return clean;
  return `FBRS-${clean.replaceAll(" ", "-")}`;
}

export function fallbackBidRuleSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.17;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
