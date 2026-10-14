import { normalizeManualTierProposalCode } from "../../tier/fallback-tier-allocation/manual-tier-proposal-policy.js";
import { PendingTierAudit } from "../../tier/fallback-tier-allocation/pending-tier-audit.js";
import { StrictInviteMetric, newStrictInviteMetric } from "./strict-invite-metric.js";

export function summarizePendingTierAuditsForMetric(items: PendingTierAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveStrictInviteMetricsFromAudit(items: PendingTierAudit[]): StrictInviteMetric[] {
  const out: StrictInviteMetric[] = [];
  for (const item of items) {
    const derived = newStrictInviteMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreStrictInviteMetric(item: StrictInviteMetric): string {
  return normalizeManualTierProposalCode(item.code);
}
