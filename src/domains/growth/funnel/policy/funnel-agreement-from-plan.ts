import { CohortPlan } from "../../cohort/schedule/cohort-plan.js";
import { classifyCohortSummary } from "../../cohort/schedule/cohort-summary-policy.js";
import { FunnelAgreement, newFunnelAgreement } from "./funnel-agreement.js";

export function summarizeCohortPlansForAgreement(items: CohortPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveFunnelAgreementsFromPlan(items: CohortPlan[]): FunnelAgreement[] {
  const out: FunnelAgreement[] = [];
  for (const item of items) {
    const derived = newFunnelAgreement(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreFunnelAgreement(item: FunnelAgreement): string {
  return classifyCohortSummary(item.measuredValue());
}
