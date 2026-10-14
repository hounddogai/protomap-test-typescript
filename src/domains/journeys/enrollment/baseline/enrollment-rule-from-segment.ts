import { classifyStepVariance } from "../../step/segment/step-variance-policy.js";
import { TieredStepSegment } from "../../step/segment/tiered-step-segment.js";
import { EnrollmentRule, newEnrollmentRule } from "./enrollment-rule.js";

export function summarizeTieredStepSegmentsForRule(items: TieredStepSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveEnrollmentRulesFromSegment(items: TieredStepSegment[]): EnrollmentRule[] {
  const out: EnrollmentRule[] = [];
  for (const item of items) {
    const derived = newEnrollmentRule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveEnrollmentRule(item: EnrollmentRule): string {
  return classifyStepVariance(item.measuredValue());
}
