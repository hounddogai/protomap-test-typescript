import { classifyAdaptiveExitRuleDraft } from "../../exit-rule/snapshot/adaptive-exit-rule-draft-policy.js";
import { TieredExitRuleAgreement } from "../../exit-rule/snapshot/tiered-exit-rule-agreement.js";
import { StrictEnrollmentAdjustment, newStrictEnrollmentAdjustment } from "./strict-enrollment-adjustment.js";

export function summarizeTieredExitRuleAgreementsForAdjustment(items: TieredExitRuleAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveStrictEnrollmentAdjustmentsFromAgreement(items: TieredExitRuleAgreement[]): StrictEnrollmentAdjustment[] {
  const out: StrictEnrollmentAdjustment[] = [];
  for (const item of items) {
    const derived = newStrictEnrollmentAdjustment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveStrictEnrollmentAdjustment(item: StrictEnrollmentAdjustment): string {
  return classifyAdaptiveExitRuleDraft(item.projectedTotal());
}
