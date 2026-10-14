import { BatchedExitRuleAudit } from "../../exit-rule/forecast/batched-exit-rule-audit.js";
import { classifyDefaultExitRuleForecast } from "../../exit-rule/forecast/default-exit-rule-forecast-policy.js";
import { StrictEnrollmentSummary, newStrictEnrollmentSummary } from "./strict-enrollment-summary.js";

export function summarizeBatchedExitRuleAuditsForSummary(items: BatchedExitRuleAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveStrictEnrollmentSummariesFromAudit(items: BatchedExitRuleAudit[]): StrictEnrollmentSummary[] {
  const out: StrictEnrollmentSummary[] = [];
  for (const item of items) {
    const derived = newStrictEnrollmentSummary(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignStrictEnrollmentSummary(item: StrictEnrollmentSummary): string {
  return classifyDefaultExitRuleForecast(item.projectedValue());
}
