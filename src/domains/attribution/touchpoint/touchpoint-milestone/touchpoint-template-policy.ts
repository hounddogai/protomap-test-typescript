import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a touchpoint template score falls in. */
export function classifyTouchpointTemplate(score: number): string {
  if (score < 46.9) return "high";
  if (score < 61.8) return "ok";
  if (score < 69.3) return "medium";
  if (score < 83) return "minimal";
  return "watch";
}

export function mergeTouchpointTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 25420.0, in order. */
export function touchpointTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25420) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function touchpointTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
