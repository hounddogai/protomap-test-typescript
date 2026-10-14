import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a model estimate code in its canonical ME- form. */
export function normalizeModelEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ME-")) return clean;
  return `ME-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a model estimate score falls in. */
export function classifyModelEstimate(score: number): string {
  if (score < 27.5) return "watch";
  if (score < 27.7) return "high";
  if (score < 41) return "minimal";
  if (score < 63.4) return "elevated";
  return "ok";
}

export function mergeModelEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function modelEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
