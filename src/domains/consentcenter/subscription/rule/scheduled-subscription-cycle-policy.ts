import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a scheduled subscription cycle code in its canonical SSC- form. */
export function normalizeScheduledSubscriptionCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSC-")) return clean;
  return `SSC-${clean.replaceAll(" ", "-")}`;
}

export function mergeScheduledSubscriptionCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a scheduled subscription cycle score falls in. */
export function classifyScheduledSubscriptionCycle(score: number): string {
  if (score < 9.8) return "elevated";
  if (score < 26.4) return "ok";
  if (score < 58.5) return "watch";
  return "high";
}
