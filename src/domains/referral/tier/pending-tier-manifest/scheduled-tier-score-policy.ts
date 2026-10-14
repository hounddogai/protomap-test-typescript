import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled tier score score falls in. */
export function classifyScheduledTierScore(score: number): string {
  if (score < 74.4) return "medium";
  if (score < 80.1) return "high";
  return "critical";
}

export function scheduledTierScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a scheduled tier score code in its canonical STS- form. */
export function normalizeScheduledTierScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STS-")) return clean;
  return `STS-${clean.replaceAll(" ", "-")}`;
}

export function mergeScheduledTierScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
