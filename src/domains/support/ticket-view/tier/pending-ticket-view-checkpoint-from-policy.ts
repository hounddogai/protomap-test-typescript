import { scheduledDeflectionRecordBucket } from "../../deflection/baseline/scheduled-deflection-record-policy.js";
import { SeasonalDeflectionPolicy } from "../../deflection/baseline/seasonal-deflection-policy.js";
import { PendingTicketViewCheckpoint, newPendingTicketViewCheckpoint } from "./pending-ticket-view-checkpoint.js";

export function summarizeSeasonalDeflectionPoliciesForCheckpoint(items: SeasonalDeflectionPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function derivePendingTicketViewCheckpointsFromPolicy(items: SeasonalDeflectionPolicy[]): PendingTicketViewCheckpoint[] {
  const out: PendingTicketViewCheckpoint[] = [];
  for (const item of items) {
    const derived = newPendingTicketViewCheckpoint(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function derivePendingTicketViewCheckpoint(item: PendingTicketViewCheckpoint): string {
  return scheduledDeflectionRecordBucket(item.adjustedLoad());
}
