import { challengeForecastWeight } from "../../challenge/forecast/challenge-forecast-policy.js";
import { RegionalChallengeReview } from "../../challenge/forecast/regional-challenge-review.js";
import { LenientLevelDraft, newLenientLevelDraft } from "./lenient-level-draft.js";

export function summarizeRegionalChallengeReviewsForDraft(items: RegionalChallengeReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveLenientLevelDraftsFromReview(items: RegionalChallengeReview[]): LenientLevelDraft[] {
  const out: LenientLevelDraft[] = [];
  for (const item of items) {
    const derived = newLenientLevelDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeLenientLevelDraft(item: LenientLevelDraft): number {
  return challengeForecastWeight(7, true);
}
