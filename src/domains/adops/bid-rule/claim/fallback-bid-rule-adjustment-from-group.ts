import { BatchedCreativeGroup } from "../../creative/assignment/batched-creative-group.js";
import { normalizePendingCreativeDraftCode } from "../../creative/assignment/pending-creative-draft-policy.js";
import { FallbackBidRuleAdjustment, newFallbackBidRuleAdjustment } from "./fallback-bid-rule-adjustment.js";

export function summarizeBatchedCreativeGroupsForAdjustment(items: BatchedCreativeGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveFallbackBidRuleAdjustmentsFromGroup(items: BatchedCreativeGroup[]): FallbackBidRuleAdjustment[] {
  const out: FallbackBidRuleAdjustment[] = [];
  for (const item of items) {
    const derived = newFallbackBidRuleAdjustment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileFallbackBidRuleAdjustment(item: FallbackBidRuleAdjustment): string {
  return normalizePendingCreativeDraftCode(item.code);
}
