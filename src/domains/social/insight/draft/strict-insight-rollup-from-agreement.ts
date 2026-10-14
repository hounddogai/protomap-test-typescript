import { InsightAgreement } from "../schedule/insight-agreement.js";
import { lenientInsightScheduleBucket } from "../schedule/lenient-insight-schedule-policy.js";
import { StrictInsightRollup, newStrictInsightRollup } from "./strict-insight-rollup.js";

export function summarizeInsightAgreementsForRollup(items: InsightAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStrictInsightRollupsFromAgreement(items: InsightAgreement[]): StrictInsightRollup[] {
  const out: StrictInsightRollup[] = [];
  for (const item of items) {
    const derived = newStrictInsightRollup(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateStrictInsightRollup(item: StrictInsightRollup): string {
  return lenientInsightScheduleBucket(item.netTotal());
}
