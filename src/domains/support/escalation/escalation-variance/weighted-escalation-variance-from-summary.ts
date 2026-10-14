import { classifyLegacyTicketViewSummary } from "../../ticket-view/summary/legacy-ticket-view-summary-policy.js";
import { LegacyTicketViewSummary } from "../../ticket-view/summary/legacy-ticket-view-summary.js";
import { WeightedEscalationVariance, newWeightedEscalationVariance } from "./weighted-escalation-variance.js";

export function summarizeLegacyTicketViewSummariesForVariance(items: LegacyTicketViewSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveWeightedEscalationVariancesFromSummary(items: LegacyTicketViewSummary[]): WeightedEscalationVariance[] {
  const out: WeightedEscalationVariance[] = [];
  for (const item of items) {
    const derived = newWeightedEscalationVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileWeightedEscalationVariance(item: WeightedEscalationVariance): string {
  return classifyLegacyTicketViewSummary(item.measuredValue());
}
