import { inviteMilestoneBucket } from "../../invite/group/invite-milestone-policy.js";
import { RollingInviteBundle } from "../../invite/group/rolling-invite-bundle.js";
import { FraudCheckRequest, newFraudCheckRequest } from "./fraud-check-request.js";

export function summarizeRollingInviteBundlesForRequest(items: RollingInviteBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFraudCheckRequestsFromBundle(items: RollingInviteBundle[]): FraudCheckRequest[] {
  const out: FraudCheckRequest[] = [];
  for (const item of items) {
    const derived = newFraudCheckRequest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchFraudCheckRequest(item: FraudCheckRequest): string {
  return inviteMilestoneBucket(item.effectiveValue());
}
