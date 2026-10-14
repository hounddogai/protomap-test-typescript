import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a bid rule forecast score falls in. */
export function classifyBidRuleForecast(score: number): string {
  if (score < 90.3) return "critical";
  if (score < 99.2) return "high";
  return "low";
}

export function bidRuleForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.44;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 30260.0, in order. */
export function bidRuleForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30260) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeBidRuleForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
