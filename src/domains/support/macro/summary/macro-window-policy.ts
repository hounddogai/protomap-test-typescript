import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeMacroWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function macroWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.94;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a macro window score falls in. */
export function classifyMacroWindow(score: number): string {
  if (score < 3) return "medium";
  if (score < 50.5) return "critical";
  if (score < 69) return "watch";
  if (score < 69.4) return "high";
  return "minimal";
}
