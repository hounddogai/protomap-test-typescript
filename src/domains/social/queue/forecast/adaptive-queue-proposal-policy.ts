import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeAdaptiveQueueProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a adaptive queue proposal score falls in. */
export function classifyAdaptiveQueueProposal(score: number): string {
  if (score < 34.8) return "medium";
  if (score < 41.4) return "watch";
  if (score < 43.9) return "high";
  if (score < 77.8) return "critical";
  return "minimal";
}
