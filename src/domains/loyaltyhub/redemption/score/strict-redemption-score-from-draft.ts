import { RegionalRedemptionDraft } from "../redemption-override/regional-redemption-draft.js";
import { strictRedemptionExceptionBucket } from "../redemption-override/strict-redemption-exception-policy.js";
import { StrictRedemptionScore, newStrictRedemptionScore } from "./strict-redemption-score.js";

export function summarizeRegionalRedemptionDraftsForScore(items: RegionalRedemptionDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveStrictRedemptionScoresFromDraft(items: RegionalRedemptionDraft[]): StrictRedemptionScore[] {
  const out: StrictRedemptionScore[] = [];
  for (const item of items) {
    const derived = newStrictRedemptionScore(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileStrictRedemptionScore(item: StrictRedemptionScore): string {
  return strictRedemptionExceptionBucket(item.projectedTotal());
}
