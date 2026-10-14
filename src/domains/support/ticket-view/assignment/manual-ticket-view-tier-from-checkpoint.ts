import { normalizeBatchedTicketViewTierCode } from "../tier/batched-ticket-view-tier-policy.js";
import { PendingTicketViewCheckpoint } from "../tier/pending-ticket-view-checkpoint.js";
import { ManualTicketViewTier, newManualTicketViewTier } from "./manual-ticket-view-tier.js";

export function summarizePendingTicketViewCheckpointsForTier(items: PendingTicketViewCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveManualTicketViewTiersFromCheckpoint(items: PendingTicketViewCheckpoint[]): ManualTicketViewTier[] {
  const out: ManualTicketViewTier[] = [];
  for (const item of items) {
    const derived = newManualTicketViewTier(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeManualTicketViewTier(item: ManualTicketViewTier): string {
  return normalizeBatchedTicketViewTierCode(item.code);
}
