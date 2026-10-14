import { normalizeExitRuleBaselineCode } from "../../exit-rule/baseline/exit-rule-baseline-policy.js";
import { ScheduledExitRuleNotice } from "../../exit-rule/baseline/scheduled-exit-rule-notice.js";
import { EnrollmentRollup, newEnrollmentRollup } from "./enrollment-rollup.js";

export function summarizeScheduledExitRuleNoticesForRollup(items: ScheduledExitRuleNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveEnrollmentRollupsFromNotice(items: ScheduledExitRuleNotice[]): EnrollmentRollup[] {
  const out: EnrollmentRollup[] = [];
  for (const item of items) {
    const derived = newEnrollmentRollup(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeEnrollmentRollup(item: EnrollmentRollup): string {
  return normalizeExitRuleBaselineCode(item.code);
}
