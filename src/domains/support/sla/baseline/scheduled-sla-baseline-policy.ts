import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function scheduledSlaBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a scheduled sla baseline code in its canonical SSB- form. */
export function normalizeScheduledSlaBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSB-")) return clean;
  return `SSB-${clean.replaceAll(" ", "-")}`;
}

export function mergeScheduledSlaBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a scheduled sla baseline score falls in. */
export function classifyScheduledSlaBaseline(score: number): string {
  if (score < 52.8) return "medium";
  if (score < 56.1) return "low";
  return "ok";
}
