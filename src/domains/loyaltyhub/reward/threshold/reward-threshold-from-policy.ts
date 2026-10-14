import { normalizeRewardPolicyCode } from "../policy/reward-policy-policy.js";
import { RewardPolicy } from "../policy/reward-policy.js";
import { RewardThreshold, newRewardThreshold } from "./reward-threshold.js";

export function summarizeRewardPoliciesForThreshold(items: RewardPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveRewardThresholdsFromPolicy(items: RewardPolicy[]): RewardThreshold[] {
  const out: RewardThreshold[] = [];
  for (const item of items) {
    const derived = newRewardThreshold(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyRewardThresholdExtra(item: RewardThreshold): string {
  return normalizeRewardPolicyCode(item.code);
}
