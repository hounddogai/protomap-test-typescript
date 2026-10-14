import { proofGroupBucket } from "../../proof/proof-rule/proof-group-policy.js";
import { RegionalProofRule } from "../../proof/proof-rule/regional-proof-rule.js";
import {
  AdaptiveSubscriptionCheckpoint,
  newAdaptiveSubscriptionCheckpoint,
} from "./adaptive-subscription-checkpoint.js";

export function summarizeRegionalProofRulesForCheckpoint(items: RegionalProofRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveAdaptiveSubscriptionCheckpointsFromRule(items: RegionalProofRule[]): AdaptiveSubscriptionCheckpoint[] {
  const out: AdaptiveSubscriptionCheckpoint[] = [];
  for (const item of items) {
    const derived = newAdaptiveSubscriptionCheckpoint(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchAdaptiveSubscriptionCheckpoint(item: AdaptiveSubscriptionCheckpoint): string {
  return proofGroupBucket(item.adjustedTotal());
}
