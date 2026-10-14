import { LegacyActivationException } from "../../activation/activation-review/legacy-activation-exception.js";
import {
  normalizeWeightedActivationReviewCode,
} from "../../activation/activation-review/weighted-activation-review-policy.js";
import { RetentionPolicy, newRetentionPolicy } from "./retention-policy.js";

export function summarizeLegacyActivationExceptionsForPolicy(items: LegacyActivationException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRetentionPoliciesFromException(items: LegacyActivationException[]): RetentionPolicy[] {
  const out: RetentionPolicy[] = [];
  for (const item of items) {
    const derived = newRetentionPolicy(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveRetentionPolicy(item: RetentionPolicy): string {
  return normalizeWeightedActivationReviewCode(item.code);
}
