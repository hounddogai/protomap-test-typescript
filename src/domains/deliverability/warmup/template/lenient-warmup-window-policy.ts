import * as numbers from "../../../../kit/numbers.js";

export function lenientWarmupWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a lenient warmup window code in its canonical LWW- form. */
export function normalizeLenientWarmupWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LWW-")) return clean;
  return `LWW-${clean.replaceAll(" ", "-")}`;
}

export function lenientWarmupWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a lenient warmup window score falls in. */
export function classifyLenientWarmupWindow(score: number): string {
  if (score < 13.7) return "elevated";
  if (score < 55.2) return "low";
  if (score < 95) return "ok";
  return "minimal";
}
