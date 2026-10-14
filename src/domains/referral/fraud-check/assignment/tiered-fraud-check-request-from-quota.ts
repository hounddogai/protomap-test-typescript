import { adaptiveInviteProposalBucket } from "../../invite/quota/adaptive-invite-proposal-policy.js";
import { InviteQuota } from "../../invite/quota/invite-quota.js";
import { TieredFraudCheckRequest, newTieredFraudCheckRequest } from "./tiered-fraud-check-request.js";

export function summarizeInviteQuotasForRequest(items: InviteQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredFraudCheckRequestsFromQuota(items: InviteQuota[]): TieredFraudCheckRequest[] {
  const out: TieredFraudCheckRequest[] = [];
  for (const item of items) {
    const derived = newTieredFraudCheckRequest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planTieredFraudCheckRequest(item: TieredFraudCheckRequest): string {
  return adaptiveInviteProposalBucket(item.measuredValue());
}
