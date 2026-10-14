import { classifyManualBidRuleAgreement } from "../../bid-rule/preference/manual-bid-rule-agreement-policy.js";
import { ManualBidRuleAgreement } from "../../bid-rule/preference/manual-bid-rule-agreement.js";
import { PacingMetric, newPacingMetric } from "./pacing-metric.js";

export function summarizeManualBidRuleAgreementsForMetric(items: ManualBidRuleAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function derivePacingMetricsFromAgreement(items: ManualBidRuleAgreement[]): PacingMetric[] {
  const out: PacingMetric[] = [];
  for (const item of items) {
    const derived = newPacingMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchPacingMetric(item: PacingMetric): string {
  return classifyManualBidRuleAgreement(item.projectedLoad());
}
