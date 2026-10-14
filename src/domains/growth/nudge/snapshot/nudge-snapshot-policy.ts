import * as numbers from "../../../../kit/numbers.js";

/** Puts a nudge snapshot code in its canonical NS- form. */
export function normalizeNudgeSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("NS-")) return clean;
  return `NS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a nudge snapshot score falls in. */
export function classifyNudgeSnapshot(score: number): string {
  if (score < 35) return "low";
  if (score < 88.5) return "minimal";
  return "high";
}

export function nudgeSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function nudgeSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
