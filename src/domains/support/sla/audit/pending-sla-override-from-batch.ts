import { classifyStrictTicketViewBatch } from "../../ticket-view/batch/strict-ticket-view-batch-policy.js";
import { StrictTicketViewBatch } from "../../ticket-view/batch/strict-ticket-view-batch.js";
import { PendingSlaOverride, newPendingSlaOverride } from "./pending-sla-override.js";

export function summarizeStrictTicketViewBatchesForOverride(items: StrictTicketViewBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingSlaOverridesFromBatch(items: StrictTicketViewBatch[]): PendingSlaOverride[] {
  const out: PendingSlaOverride[] = [];
  for (const item of items) {
    const derived = newPendingSlaOverride(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scorePendingSlaOverride(item: PendingSlaOverride): string {
  return classifyStrictTicketViewBatch(item.measuredValue());
}
