import { BatchedEnrollmentTemplate } from "../../enrollment/enrollment-digest/batched-enrollment-template.js";
import { strictEnrollmentDigestBucket } from "../../enrollment/enrollment-digest/strict-enrollment-digest-policy.js";
import { RollingStepPolicy, newRollingStepPolicy } from "./rolling-step-policy.js";

export function summarizeBatchedEnrollmentTemplatesForPolicy(items: BatchedEnrollmentTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingStepPoliciesFromTemplate(items: BatchedEnrollmentTemplate[]): RollingStepPolicy[] {
  const out: RollingStepPolicy[] = [];
  for (const item of items) {
    const derived = newRollingStepPolicy(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateRollingStepPolicy(item: RollingStepPolicy): string {
  return strictEnrollmentDigestBucket(item.projectedTotal());
}
