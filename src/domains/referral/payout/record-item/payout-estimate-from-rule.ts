import { cappedFraudCheckClaimWeight } from "../../fraud-check/check-claim/capped-fraud-check-claim-policy.js";
import { LegacyFraudCheckRule } from "../../fraud-check/check-claim/legacy-fraud-check-rule.js";
import { PayoutEstimate, newPayoutEstimate } from "./payout-estimate.js";

export function summarizeLegacyFraudCheckRulesForEstimate(items: LegacyFraudCheckRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePayoutEstimatesFromRule(items: LegacyFraudCheckRule[]): PayoutEstimate[] {
  const out: PayoutEstimate[] = [];
  for (const item of items) {
    const derived = newPayoutEstimate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankPayoutEstimate(item: PayoutEstimate): number {
  return cappedFraudCheckClaimWeight(7, true);
}
