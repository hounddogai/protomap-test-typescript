import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeChallengeProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a challenge proposal score falls in. */
export function classifyChallengeProposal(score: number): string {
  if (score < 3.8) return "ok";
  if (score < 12.7) return "watch";
  if (score < 58.6) return "elevated";
  return "minimal";
}
