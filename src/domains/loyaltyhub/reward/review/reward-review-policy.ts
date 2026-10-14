import * as numbers from "../../../../kit/numbers.js";

export function rewardReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a reward review code in its canonical RR- form. */
export function normalizeRewardReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}
