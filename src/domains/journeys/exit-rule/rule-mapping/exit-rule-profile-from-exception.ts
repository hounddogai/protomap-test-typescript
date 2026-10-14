import { stepClaimWeight } from "../../step/claim/step-claim-policy.js";
import { StepException } from "../../step/claim/step-exception.js";
import { ExitRuleProfile, newExitRuleProfile } from "./exit-rule-profile.js";

export function summarizeStepExceptionsForProfile(items: StepException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveExitRuleProfilesFromException(items: StepException[]): ExitRuleProfile[] {
  const out: ExitRuleProfile[] = [];
  for (const item of items) {
    const derived = newExitRuleProfile(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveExitRuleProfile(item: ExitRuleProfile): number {
  return stepClaimWeight(4, true);
}
