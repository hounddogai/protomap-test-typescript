import {
  seasonalEscalationRecordWeight,
} from "../../escalation/escalation-variance/seasonal-escalation-record-policy.js";
import { WeightedEscalationVariance } from "../../escalation/escalation-variance/weighted-escalation-variance.js";
import { PrimarySlaMapping, newPrimarySlaMapping } from "./primary-sla-mapping.js";

export function summarizeWeightedEscalationVariancesForMapping(items: WeightedEscalationVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimarySlaMappingsFromVariance(items: WeightedEscalationVariance[]): PrimarySlaMapping[] {
  const out: PrimarySlaMapping[] = [];
  for (const item of items) {
    const derived = newPrimarySlaMapping(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function derivePrimarySlaMapping(item: PrimarySlaMapping): number {
  return seasonalEscalationRecordWeight(5, true);
}
