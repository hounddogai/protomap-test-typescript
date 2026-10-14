import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacyTicketViewCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a legacy ticket view cycle score falls in. */
export function classifyLegacyTicketViewCycle(score: number): string {
  if (score < 25.5) return "minimal";
  if (score < 41.3) return "high";
  if (score < 62.5) return "watch";
  if (score < 92.1) return "medium";
  return "elevated";
}

export function legacyTicketViewCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function legacyTicketViewCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
