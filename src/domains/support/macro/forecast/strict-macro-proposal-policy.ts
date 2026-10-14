import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeStrictMacroProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function strictMacroProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a strict macro proposal score falls in. */
export function classifyStrictMacroProposal(score: number): string {
  if (score < 11.9) return "ok";
  if (score < 13.1) return "low";
  if (score < 74.9) return "watch";
  if (score < 75) return "high";
  return "minimal";
}
