import { classifyFraudCheckDigest } from "../../fraud-check/group/fraud-check-digest-policy.js";
import { FraudCheckPreference } from "../../fraud-check/group/fraud-check-preference.js";
import { RewardRuleClaim, newRewardRuleClaim } from "./reward-rule-claim.js";

export function summarizeFraudCheckPreferencesForClaim(items: FraudCheckPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveRewardRuleClaimsFromPreference(items: FraudCheckPreference[]): RewardRuleClaim[] {
  const out: RewardRuleClaim[] = [];
  for (const item of items) {
    const derived = newRewardRuleClaim(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planRewardRuleClaim(item: RewardRuleClaim): string {
  return classifyFraudCheckDigest(item.measuredValue());
}
