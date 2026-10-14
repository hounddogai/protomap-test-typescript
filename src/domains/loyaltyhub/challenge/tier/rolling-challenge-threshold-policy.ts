import * as numbers from "../../../../kit/numbers.js";

export function rollingChallengeThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a rolling challenge threshold code in its canonical RCT- form. */
export function normalizeRollingChallengeThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCT-")) return clean;
  return `RCT-${clean.replaceAll(" ", "-")}`;
}
