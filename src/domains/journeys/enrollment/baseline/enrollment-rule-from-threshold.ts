import { JourneyThreshold } from "../../journey/threshold/journey-threshold.js";
import { normalizeLegacyJourneyMappingCode } from "../../journey/threshold/legacy-journey-mapping-policy.js";
import { EnrollmentRule, newEnrollmentRule } from "./enrollment-rule.js";

export function summarizeJourneyThresholdsForRule(items: JourneyThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveEnrollmentRulesFromThreshold(items: JourneyThreshold[]): EnrollmentRule[] {
  const out: EnrollmentRule[] = [];
  for (const item of items) {
    const derived = newEnrollmentRule(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveEnrollmentRuleExtra(item: EnrollmentRule): string {
  return normalizeLegacyJourneyMappingCode(item.code);
}
