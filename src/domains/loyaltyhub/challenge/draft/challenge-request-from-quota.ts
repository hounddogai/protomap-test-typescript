import { RedemptionQuota } from "../../redemption/quota/redemption-quota.js";
import { normalizeRedemptionRollupCode } from "../../redemption/quota/redemption-rollup-policy.js";
import { ChallengeRequest, newChallengeRequest } from "./challenge-request.js";

export function summarizeRedemptionQuotasForRequest(items: RedemptionQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveChallengeRequestsFromQuota(items: RedemptionQuota[]): ChallengeRequest[] {
  const out: ChallengeRequest[] = [];
  for (const item of items) {
    const derived = newChallengeRequest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeChallengeRequest(item: ChallengeRequest): string {
  return normalizeRedemptionRollupCode(item.code);
}
