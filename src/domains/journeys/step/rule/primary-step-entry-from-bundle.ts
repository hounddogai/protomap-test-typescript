import { AdaptiveExitRuleBundle } from "../../exit-rule/rule-mapping/adaptive-exit-rule-bundle.js";
import { classifyPrimaryExitRuleAgreement } from "../../exit-rule/rule-mapping/primary-exit-rule-agreement-policy.js";
import { PrimaryStepEntry, newPrimaryStepEntry } from "./primary-step-entry.js";

export function summarizeAdaptiveExitRuleBundlesForEntry(items: AdaptiveExitRuleBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function derivePrimaryStepEntriesFromBundle(items: AdaptiveExitRuleBundle[]): PrimaryStepEntry[] {
  const out: PrimaryStepEntry[] = [];
  for (const item of items) {
    const derived = newPrimaryStepEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scorePrimaryStepEntry(item: PrimaryStepEntry): string {
  return classifyPrimaryExitRuleAgreement(item.effectiveTotal());
}
