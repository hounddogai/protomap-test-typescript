import { manualRedemptionAgreementWeight } from "../../redemption/adjustment/manual-redemption-agreement-policy.js";
import { StrictRedemptionAgreement } from "../../redemption/adjustment/strict-redemption-agreement.js";
import { PendingRewardRollup, newPendingRewardRollup } from "./pending-reward-rollup.js";

export function summarizeStrictRedemptionAgreementsForRollup(items: StrictRedemptionAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePendingRewardRollupsFromAgreement(items: StrictRedemptionAgreement[]): PendingRewardRollup[] {
  const out: PendingRewardRollup[] = [];
  for (const item of items) {
    const derived = newPendingRewardRollup(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcilePendingRewardRollup(item: PendingRewardRollup): number {
  return manualRedemptionAgreementWeight(2, true);
}
