import { classifyLenientTicketViewMetric } from "../../ticket-view/ledger/lenient-ticket-view-metric-policy.js";
import { TicketViewLedger } from "../../ticket-view/ledger/ticket-view-ledger.js";
import { SlaBudget, newSlaBudget } from "./sla-budget.js";

export function summarizeTicketViewLedgersForBudget(items: TicketViewLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveSlaBudgetsFromLedger(items: TicketViewLedger[]): SlaBudget[] {
  const out: SlaBudget[] = [];
  for (const item of items) {
    const derived = newSlaBudget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreSlaBudget(item: SlaBudget): string {
  return classifyLenientTicketViewMetric(item.netVolume());
}
