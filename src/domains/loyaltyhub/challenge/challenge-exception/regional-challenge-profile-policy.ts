import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeRegionalChallengeProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a regional challenge profile code in its canonical RCP- form. */
export function normalizeRegionalChallengeProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCP-")) return clean;
  return `RCP-${clean.replaceAll(" ", "-")}`;
}

export function regionalChallengeProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a regional challenge profile score falls in. */
export function classifyRegionalChallengeProfile(score: number): string {
  if (score < 13.8) return "high";
  if (score < 21.4) return "low";
  if (score < 61.9) return "ok";
  if (score < 66) return "minimal";
  return "critical";
}
