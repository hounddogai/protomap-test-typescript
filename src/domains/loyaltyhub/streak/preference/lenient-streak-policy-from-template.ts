import { AdaptiveChallengeTemplate } from "../../challenge/challenge-proposal/adaptive-challenge-template.js";
import {
  classifyBatchedChallengeReview,
} from "../../challenge/challenge-proposal/batched-challenge-review-policy.js";
import { LenientStreakPolicy, newLenientStreakPolicy } from "./lenient-streak-policy.js";

export function summarizeAdaptiveChallengeTemplatesForPolicy(items: AdaptiveChallengeTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveLenientStreakPoliciesFromTemplate(items: AdaptiveChallengeTemplate[]): LenientStreakPolicy[] {
  const out: LenientStreakPolicy[] = [];
  for (const item of items) {
    const derived = newLenientStreakPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankLenientStreakPolicy(item: LenientStreakPolicy): string {
  return classifyBatchedChallengeReview(item.netValue());
}
