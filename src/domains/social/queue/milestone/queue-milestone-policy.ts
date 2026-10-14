import * as numbers from "../../../../kit/numbers.js";

export function queueMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a queue milestone code in its canonical QM- form. */
export function normalizeQueueMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QM-")) return clean;
  return `QM-${clean.replaceAll(" ", "-")}`;
}

export function queueMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
