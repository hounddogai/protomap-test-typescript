import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function legacySubscriptionSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 75394.0, in order. */
export function legacySubscriptionSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75394) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a legacy subscription slot score falls in. */
export function classifyLegacySubscriptionSlot(score: number): string {
  if (score < 17.1) return "watch";
  if (score < 61.1) return "ok";
  if (score < 90.6) return "critical";
  return "low";
}

export function mergeLegacySubscriptionSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
