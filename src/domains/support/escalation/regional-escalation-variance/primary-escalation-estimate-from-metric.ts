import { normalizeManualEscalationLedgerCode } from "../ledger/manual-escalation-ledger-policy.js";
import { SeasonalEscalationMetric } from "../ledger/seasonal-escalation-metric.js";
import { PrimaryEscalationEstimate, newPrimaryEscalationEstimate } from "./primary-escalation-estimate.js";

export function summarizeSeasonalEscalationMetricsForEstimate(items: SeasonalEscalationMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePrimaryEscalationEstimatesFromMetric(items: SeasonalEscalationMetric[]): PrimaryEscalationEstimate[] {
  const out: PrimaryEscalationEstimate[] = [];
  for (const item of items) {
    const derived = newPrimaryEscalationEstimate(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimatePrimaryEscalationEstimate(item: PrimaryEscalationEstimate): string {
  return normalizeManualEscalationLedgerCode(item.code);
}
