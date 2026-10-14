import * as numbers from "../../../../kit/numbers.js";

export function macroSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a macro segment score falls in. */
export function classifyMacroSegment(score: number): string {
  if (score < 19.7) return "ok";
  if (score < 22.6) return "watch";
  if (score < 41.4) return "high";
  return "medium";
}
