import { classifyExitRuleSegment } from "../../exit-rule/threshold/exit-rule-segment-policy.js";
import { RegionalExitRuleNotice } from "../../exit-rule/threshold/regional-exit-rule-notice.js";
import { BatchedJourneyAgreement, newBatchedJourneyAgreement } from "./batched-journey-agreement.js";

export function summarizeRegionalExitRuleNoticesForAgreement(items: RegionalExitRuleNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveBatchedJourneyAgreementsFromNotice(items: RegionalExitRuleNotice[]): BatchedJourneyAgreement[] {
  const out: BatchedJourneyAgreement[] = [];
  for (const item of items) {
    const derived = newBatchedJourneyAgreement(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleBatchedJourneyAgreement(item: BatchedJourneyAgreement): string {
  return classifyExitRuleSegment(item.measuredValue());
}
