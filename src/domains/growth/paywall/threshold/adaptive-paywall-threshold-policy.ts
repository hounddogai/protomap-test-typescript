import * as numbers from "../../../../kit/numbers.js";

export function adaptivePaywallThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function adaptivePaywallThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a adaptive paywall threshold score falls in. */
export function classifyAdaptivePaywallThreshold(score: number): string {
  if (score < 4) return "ok";
  if (score < 10.9) return "high";
  if (score < 66.7) return "critical";
  if (score < 96.2) return "minimal";
  return "medium";
}

/** Puts a adaptive paywall threshold code in its canonical APT- form. */
export function normalizeAdaptivePaywallThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APT-")) return clean;
  return `APT-${clean.replaceAll(" ", "-")}`;
}
