import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled warmup plan score falls in. */
export function classifyScheduledWarmupPlan(score: number): string {
  if (score < 28.7) return "elevated";
  if (score < 30.6) return "ok";
  if (score < 40.9) return "low";
  return "minimal";
}

export function mergeScheduledWarmupPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a scheduled warmup plan code in its canonical SWP- form. */
export function normalizeScheduledWarmupPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SWP-")) return clean;
  return `SWP-${clean.replaceAll(" ", "-")}`;
}
