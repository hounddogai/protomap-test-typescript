import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a default mention mapping score falls in. */
export function classifyDefaultMentionMapping(score: number): string {
  if (score < 5.7) return "high";
  if (score < 88) return "critical";
  return "watch";
}

/** Puts a default mention mapping code in its canonical DMM- form. */
export function normalizeDefaultMentionMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DMM-")) return clean;
  return `DMM-${clean.replaceAll(" ", "-")}`;
}

export function mergeDefaultMentionMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function defaultMentionMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
