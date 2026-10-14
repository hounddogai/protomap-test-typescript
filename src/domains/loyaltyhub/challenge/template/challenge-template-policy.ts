import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a challenge template code in its canonical CT- form. */
export function normalizeChallengeTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CT-")) return clean;
  return `CT-${clean.replaceAll(" ", "-")}`;
}

export function challengeTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function mergeChallengeTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function challengeTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
