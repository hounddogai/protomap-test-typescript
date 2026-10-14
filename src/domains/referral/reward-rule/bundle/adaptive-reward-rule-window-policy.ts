import * as numbers from "../../../../kit/numbers.js";

export function adaptiveRewardRuleWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a adaptive reward rule window score falls in. */
export function classifyAdaptiveRewardRuleWindow(score: number): string {
  if (score < 4.8) return "minimal";
  if (score < 24.9) return "elevated";
  if (score < 92.5) return "high";
  return "low";
}

/** Puts a adaptive reward rule window code in its canonical ARRW- form. */
export function normalizeAdaptiveRewardRuleWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ARRW-")) return clean;
  return `ARRW-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveRewardRuleWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
