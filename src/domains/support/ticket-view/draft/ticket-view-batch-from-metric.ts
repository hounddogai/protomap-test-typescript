import { classifyCappedCsatMetric } from "../../csat/window/capped-csat-metric-policy.js";
import { CappedCsatMetric } from "../../csat/window/capped-csat-metric.js";
import { TicketViewBatch, newTicketViewBatch } from "./ticket-view-batch.js";

export function summarizeCappedCsatMetricsForBatch(items: CappedCsatMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveTicketViewBatchesFromMetric(items: CappedCsatMetric[]): TicketViewBatch[] {
  const out: TicketViewBatch[] = [];
  for (const item of items) {
    const derived = newTicketViewBatch(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyTicketViewBatch(item: TicketViewBatch): string {
  return classifyCappedCsatMetric(item.measuredValue());
}
