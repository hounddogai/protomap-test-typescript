import { batchedCohortBundleBucket } from "../../cohort/profile/batched-cohort-bundle-policy.js";
import { CohortBundle } from "../../cohort/profile/cohort-bundle.js";
import { PrimaryActivationTemplate, newPrimaryActivationTemplate } from "./primary-activation-template.js";

export function summarizeCohortBundlesForTemplate(items: CohortBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function derivePrimaryActivationTemplatesFromBundle(items: CohortBundle[]): PrimaryActivationTemplate[] {
  const out: PrimaryActivationTemplate[] = [];
  for (const item of items) {
    const derived = newPrimaryActivationTemplate(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectPrimaryActivationTemplate(item: PrimaryActivationTemplate): string {
  return batchedCohortBundleBucket(item.adjustedValue());
}
