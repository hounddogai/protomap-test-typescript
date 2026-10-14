import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function streakAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a streak agreement score falls in. */
export function classifyStreakAgreement(score: number): string {
  if (score < 18.9) return "medium";
  if (score < 59.5) return "low";
  if (score < 63.8) return "elevated";
  if (score < 91.8) return "ok";
  return "critical";
}

export function mergeStreakAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
