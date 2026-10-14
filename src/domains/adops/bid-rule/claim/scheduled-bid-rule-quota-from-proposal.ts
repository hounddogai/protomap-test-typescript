import { classifyPlacementBatch } from "../../placement/segment/placement-batch-policy.js";
import { PlacementProposal } from "../../placement/segment/placement-proposal.js";
import { ScheduledBidRuleQuota, newScheduledBidRuleQuota } from "./scheduled-bid-rule-quota.js";

export function summarizePlacementProposalsForQuota(items: PlacementProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveScheduledBidRuleQuotasFromProposal(items: PlacementProposal[]): ScheduledBidRuleQuota[] {
  const out: ScheduledBidRuleQuota[] = [];
  for (const item of items) {
    const derived = newScheduledBidRuleQuota(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchScheduledBidRuleQuota(item: ScheduledBidRuleQuota): string {
  return classifyPlacementBatch(item.netTotal());
}
