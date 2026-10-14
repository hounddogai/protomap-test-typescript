import { normalizeRewardPolicyCode } from "../../reward/policy/reward-policy-policy.js";
import { RewardPolicy } from "../../reward/policy/reward-policy.js";
import { BadgePreference, newBadgePreference } from "./badge-preference.js";

export function summarizeRewardPoliciesForPreference(items: RewardPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveBadgePreferencesFromPolicy(items: RewardPolicy[]): BadgePreference[] {
  const out: BadgePreference[] = [];
  for (const item of items) {
    const derived = newBadgePreference(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitBadgePreference(item: BadgePreference): string {
  return normalizeRewardPolicyCode(item.code);
}
