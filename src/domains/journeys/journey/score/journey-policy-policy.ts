import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeJourneyPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a journey policy score falls in. */
export function classifyJourneyPolicy(score: number): string {
  if (score < 1.8) return "low";
  if (score < 32.9) return "high";
  if (score < 76.3) return "ok";
  return "medium";
}

/** Puts a journey policy code in its canonical JP- form. */
export function normalizeJourneyPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("JP-")) return clean;
  return `JP-${clean.replaceAll(" ", "-")}`;
}

export function journeyPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
