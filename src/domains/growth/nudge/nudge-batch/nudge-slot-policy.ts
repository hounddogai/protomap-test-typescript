import * as numbers from "../../../../kit/numbers.js";

/** Puts a nudge slot code in its canonical NS- form. */
export function normalizeNudgeSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("NS-")) return clean;
  return `NS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a nudge slot score falls in. */
export function classifyNudgeSlot(score: number): string {
  if (score < 14) return "elevated";
  if (score < 32.6) return "ok";
  if (score < 88.5) return "watch";
  return "minimal";
}

export function nudgeSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.68;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
