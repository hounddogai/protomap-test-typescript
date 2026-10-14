import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeSeasonalMacroProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function seasonalMacroProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a seasonal macro proposal score falls in. */
export function classifySeasonalMacroProposal(score: number): string {
  if (score < 20) return "medium";
  if (score < 80.3) return "ok";
  if (score < 98.9) return "watch";
  return "low";
}

export function seasonalMacroProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.66;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
