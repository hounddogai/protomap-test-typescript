import { classifyInviteTier } from "../../invite/allocation/invite-tier-policy.js";
import { InviteTier } from "../../invite/allocation/invite-tier.js";
import { FraudCheckSummary, newFraudCheckSummary } from "./fraud-check-summary.js";

export function summarizeInviteTiersForSummary(items: InviteTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveFraudCheckSummariesFromTier(items: InviteTier[]): FraudCheckSummary[] {
  const out: FraudCheckSummary[] = [];
  for (const item of items) {
    const derived = newFraudCheckSummary(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeFraudCheckSummary(item: FraudCheckSummary): string {
  return classifyInviteTier(item.projectedVolume());
}
