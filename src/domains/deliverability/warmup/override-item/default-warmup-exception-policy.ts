import * as numbers from "../../../../kit/numbers.js";

/** Puts a default warmup exception code in its canonical DWE- form. */
export function normalizeDefaultWarmupExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DWE-")) return clean;
  return `DWE-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a default warmup exception score falls in. */
export function classifyDefaultWarmupException(score: number): string {
  if (score < 25.4) return "medium";
  if (score < 53.8) return "critical";
  if (score < 79) return "low";
  if (score < 88.8) return "ok";
  return "watch";
}

export function defaultWarmupExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.19;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function defaultWarmupExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
