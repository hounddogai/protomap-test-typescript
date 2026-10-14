import { InviteProfile } from "../../invite/segment/invite-profile.js";
import { inviteThresholdWeight } from "../../invite/segment/invite-threshold-policy.js";
import { PayoutBudget, newPayoutBudget } from "./payout-budget.js";

export function summarizeInviteProfilesForBudget(items: InviteProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function derivePayoutBudgetsFromProfile(items: InviteProfile[]): PayoutBudget[] {
  const out: PayoutBudget[] = [];
  for (const item of items) {
    const derived = newPayoutBudget(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcilePayoutBudget(item: PayoutBudget): number {
  return inviteThresholdWeight(7, true);
}
