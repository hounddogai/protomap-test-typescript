import * as numbers from "../../../../kit/numbers.js";

export function activationRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a activation record code in its canonical AR- form. */
export function normalizeActivationRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AR-")) return clean;
  return `AR-${clean.replaceAll(" ", "-")}`;
}

export function activationRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a activation record score falls in. */
export function classifyActivationRecord(score: number): string {
  if (score < 27.4) return "critical";
  if (score < 29) return "ok";
  return "high";
}
