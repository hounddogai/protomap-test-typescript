import { BatchedChallengeBaseline } from "../../challenge/proposal/batched-challenge-baseline.js";
import { normalizeCappedChallengeClaimCode } from "../../challenge/proposal/capped-challenge-claim-policy.js";
import { AdaptiveRedemptionQuota, newAdaptiveRedemptionQuota } from "./adaptive-redemption-quota.js";

export function summarizeBatchedChallengeBaselinesForQuota(items: BatchedChallengeBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveAdaptiveRedemptionQuotasFromBaseline(items: BatchedChallengeBaseline[]): AdaptiveRedemptionQuota[] {
  const out: AdaptiveRedemptionQuota[] = [];
  for (const item of items) {
    const derived = newAdaptiveRedemptionQuota(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileAdaptiveRedemptionQuota(item: AdaptiveRedemptionQuota): string {
  return normalizeCappedChallengeClaimCode(item.code);
}
