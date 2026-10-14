import { ChallengeReview } from "../../challenge/template/challenge-review.js";
import { classifyChallengeTier } from "../../challenge/template/challenge-tier-policy.js";
import { LevelProfile, newLevelProfile } from "./level-profile.js";

export function summarizeChallengeReviewsForProfile(items: ChallengeReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveLevelProfilesFromReview(items: ChallengeReview[]): LevelProfile[] {
  const out: LevelProfile[] = [];
  for (const item of items) {
    const derived = newLevelProfile(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeLevelProfile(item: LevelProfile): string {
  return classifyChallengeTier(item.adjustedVolume());
}
