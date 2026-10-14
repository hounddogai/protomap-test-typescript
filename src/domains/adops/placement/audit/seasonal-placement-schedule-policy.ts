import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a seasonal placement schedule code in its canonical SPS- form. */
export function normalizeSeasonalPlacementScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPS-")) return clean;
  return `SPS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a seasonal placement schedule score falls in. */
export function classifySeasonalPlacementSchedule(score: number): string {
  if (score < 11.1) return "medium";
  if (score < 20.2) return "high";
  if (score < 50.8) return "critical";
  if (score < 98.1) return "elevated";
  return "minimal";
}

export function seasonalPlacementScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeSeasonalPlacementScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
