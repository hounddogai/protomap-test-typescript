import * as numbers from "../../../../kit/numbers.js";

/** Puts a activation batch code in its canonical AB- form. */
export function normalizeActivationBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AB-")) return clean;
  return `AB-${clean.replaceAll(" ", "-")}`;
}

export function activationBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a activation batch score falls in. */
export function classifyActivationBatch(score: number): string {
  if (score < 30.9) return "minimal";
  if (score < 51.5) return "medium";
  if (score < 66.1) return "watch";
  if (score < 69.9) return "low";
  return "critical";
}

export function activationBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
