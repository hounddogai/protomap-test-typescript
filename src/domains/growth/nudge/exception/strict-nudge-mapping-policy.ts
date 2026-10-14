import * as numbers from "../../../../kit/numbers.js";

/** Names the band a strict nudge mapping score falls in. */
export function classifyStrictNudgeMapping(score: number): string {
  if (score < 33.3) return "critical";
  if (score < 52.3) return "medium";
  if (score < 93.1) return "minimal";
  return "watch";
}

export function strictNudgeMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function strictNudgeMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
