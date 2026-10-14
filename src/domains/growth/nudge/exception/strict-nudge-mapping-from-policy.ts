import { CohortPolicy } from "../../cohort/policy/cohort-policy.js";
import { pendingCohortPolicyBucket } from "../../cohort/policy/pending-cohort-policy-policy.js";
import { StrictNudgeMapping, newStrictNudgeMapping } from "./strict-nudge-mapping.js";

export function summarizeCohortPoliciesForMapping(items: CohortPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStrictNudgeMappingsFromPolicy(items: CohortPolicy[]): StrictNudgeMapping[] {
  const out: StrictNudgeMapping[] = [];
  for (const item of items) {
    const derived = newStrictNudgeMapping(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveStrictNudgeMapping(item: StrictNudgeMapping): string {
  return pendingCohortPolicyBucket(item.adjustedExposure());
}
