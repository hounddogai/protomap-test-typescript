import * as numbers from "../../../../kit/numbers.js";

/** Puts a rolling level policy code in its canonical RLP- form. */
export function normalizeRollingLevelPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RLP-")) return clean;
  return `RLP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling level policy score falls in. */
export function classifyRollingLevelPolicy(score: number): string {
  if (score < 9.9) return "watch";
  if (score < 87.4) return "low";
  return "minimal";
}

export function rollingLevelPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
