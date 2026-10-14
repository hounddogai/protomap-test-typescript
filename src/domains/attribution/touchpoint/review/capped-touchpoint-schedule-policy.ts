import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a capped touchpoint schedule score falls in. */
export function classifyCappedTouchpointSchedule(score: number): string {
  if (score < 26.5) return "low";
  if (score < 57.6) return "medium";
  return "elevated";
}

export function mergeCappedTouchpointScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a capped touchpoint schedule code in its canonical CTS- form. */
export function normalizeCappedTouchpointScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CTS-")) return clean;
  return `CTS-${clean.replaceAll(" ", "-")}`;
}

export function cappedTouchpointScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
