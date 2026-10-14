import { normalizeBatchedCohortOverrideCode } from "../../cohort/override-item/batched-cohort-override-policy.js";
import { BatchedCohortOverride } from "../../cohort/override-item/batched-cohort-override.js";
import { ActivationEstimate, newActivationEstimate } from "./activation-estimate.js";

export function summarizeBatchedCohortOverridesForEstimate(items: BatchedCohortOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveActivationEstimatesFromOverride(items: BatchedCohortOverride[]): ActivationEstimate[] {
  const out: ActivationEstimate[] = [];
  for (const item of items) {
    const derived = newActivationEstimate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceActivationEstimate(item: ActivationEstimate): string {
  return normalizeBatchedCohortOverrideCode(item.code);
}
