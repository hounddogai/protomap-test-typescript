import { normalizeEnrollmentBaselineCode } from "../../enrollment/baseline/enrollment-baseline-policy.js";
import { EnrollmentBaseline } from "../../enrollment/baseline/enrollment-baseline.js";
import { ExitRuleScore, newExitRuleScore } from "./exit-rule-score.js";

export function summarizeEnrollmentBaselinesForScore(items: EnrollmentBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveExitRuleScoresFromBaseline(items: EnrollmentBaseline[]): ExitRuleScore[] {
  const out: ExitRuleScore[] = [];
  for (const item of items) {
    const derived = newExitRuleScore(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankExitRuleScore(item: ExitRuleScore): string {
  return normalizeEnrollmentBaselineCode(item.code);
}
