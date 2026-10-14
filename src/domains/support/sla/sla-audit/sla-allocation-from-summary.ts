import { adaptiveTicketViewLedgerWeight } from "../../ticket-view/view-summary/adaptive-ticket-view-ledger-policy.js";
import { AdaptiveTicketViewSummary } from "../../ticket-view/view-summary/adaptive-ticket-view-summary.js";
import { SlaAllocation, newSlaAllocation } from "./sla-allocation.js";

export function summarizeAdaptiveTicketViewSummariesForAllocation(items: AdaptiveTicketViewSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveSlaAllocationsFromSummary(items: AdaptiveTicketViewSummary[]): SlaAllocation[] {
  const out: SlaAllocation[] = [];
  for (const item of items) {
    const derived = newSlaAllocation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateSlaAllocation(item: SlaAllocation): number {
  return adaptiveTicketViewLedgerWeight(8, true);
}
