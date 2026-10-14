import {
  globalEscalationBundleBucket,
} from "../../escalation/lenient-escalation-notice/global-escalation-bundle-policy.js";
import { GlobalEscalationBundle } from "../../escalation/lenient-escalation-notice/global-escalation-bundle.js";
import { BatchedTicketViewTier, newBatchedTicketViewTier } from "./batched-ticket-view-tier.js";

export function summarizeGlobalEscalationBundlesForTier(items: GlobalEscalationBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveBatchedTicketViewTiersFromBundle(items: GlobalEscalationBundle[]): BatchedTicketViewTier[] {
  const out: BatchedTicketViewTier[] = [];
  for (const item of items) {
    const derived = newBatchedTicketViewTier(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateBatchedTicketViewTier(item: BatchedTicketViewTier): string {
  return globalEscalationBundleBucket(item.netVolume());
}
