import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a regional activation budget score falls in. */
export function classifyRegionalActivationBudget(score: number): string {
  if (score < 9.2) return "critical";
  if (score < 28.2) return "high";
  if (score < 73.7) return "minimal";
  if (score < 87.3) return "ok";
  return "elevated";
}

export function mergeRegionalActivationBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a regional activation budget code in its canonical RAB- form. */
export function normalizeRegionalActivationBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RAB-")) return clean;
  return `RAB-${clean.replaceAll(" ", "-")}`;
}

export function regionalActivationBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.68;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
