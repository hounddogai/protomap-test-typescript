import { inviteExceptionWeight } from "../../invite/segment/invite-exception-policy.js";
import { InviteException } from "../../invite/segment/invite-exception.js";
import { FraudCheckGroup, newFraudCheckGroup } from "./fraud-check-group.js";

export function summarizeInviteExceptionsForGroup(items: InviteException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveFraudCheckGroupsFromException(items: InviteException[]): FraudCheckGroup[] {
  const out: FraudCheckGroup[] = [];
  for (const item of items) {
    const derived = newFraudCheckGroup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileFraudCheckGroup(item: FraudCheckGroup): number {
  return inviteExceptionWeight(2, true);
}
