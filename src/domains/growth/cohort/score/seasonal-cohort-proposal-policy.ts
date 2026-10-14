import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeSeasonalCohortProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a seasonal cohort proposal score falls in. */
export function classifySeasonalCohortProposal(score: number): string {
  if (score < 7.6) return "critical";
  if (score < 13.9) return "elevated";
  if (score < 68.1) return "minimal";
  if (score < 74.3) return "watch";
  return "high";
}
