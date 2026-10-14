import { normalizeRollingLevelPolicyCode } from "../../level/policy/rolling-level-policy-policy.js";
import { RollingLevelPolicy } from "../../level/policy/rolling-level-policy.js";
import { PendingRedemptionPolicy, newPendingRedemptionPolicy } from "./pending-redemption-policy.js";

export function summarizeRollingLevelPoliciesForPolicy(items: RollingLevelPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePendingRedemptionPoliciesFromPolicy(items: RollingLevelPolicy[]): PendingRedemptionPolicy[] {
  const out: PendingRedemptionPolicy[] = [];
  for (const item of items) {
    const derived = newPendingRedemptionPolicy(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePendingRedemptionPolicy(item: PendingRedemptionPolicy): string {
  return normalizeRollingLevelPolicyCode(item.code);
}
