import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function optOutTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a opt out tier score falls in. */
export function classifyOptOutTier(score: number): string {
  if (score < 23.3) return "ok";
  if (score < 89.2) return "elevated";
  return "low";
}

export function mergeOptOutTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function optOutTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
