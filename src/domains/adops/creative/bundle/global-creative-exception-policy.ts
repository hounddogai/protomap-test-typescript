import * as numbers from "../../../../kit/numbers.js";

/** Names the band a global creative exception score falls in. */
export function classifyGlobalCreativeException(score: number): string {
  if (score < 36.4) return "ok";
  if (score < 62.8) return "minimal";
  return "elevated";
}

export function globalCreativeExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a global creative exception code in its canonical GCE- form. */
export function normalizeGlobalCreativeExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GCE-")) return clean;
  return `GCE-${clean.replaceAll(" ", "-")}`;
}

export function globalCreativeExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
