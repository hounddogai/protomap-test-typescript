import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function stepOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a step override score falls in. */
export function classifyStepOverride(score: number): string {
  if (score < 16.4) return "watch";
  if (score < 63.9) return "low";
  if (score < 72.2) return "ok";
  if (score < 85.8) return "critical";
  return "elevated";
}

/** Puts a step override code in its canonical SO- form. */
export function normalizeStepOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SO-")) return clean;
  return `SO-${clean.replaceAll(" ", "-")}`;
}

export function mergeStepOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
