import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 78765.0, in order. */
export function funnelManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78765) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function funnelManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeFunnelManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a funnel manifest score falls in. */
export function classifyFunnelManifest(score: number): string {
  if (score < 8.7) return "minimal";
  if (score < 93.2) return "ok";
  return "critical";
}
