import { fallbackRewardRuleBundleWeight } from "../../reward-rule/item/fallback-reward-rule-bundle-policy.js";
import { FallbackRewardRuleBundle } from "../../reward-rule/item/fallback-reward-rule-bundle.js";
import { InviteDigest, newInviteDigest } from "./invite-digest.js";

export function summarizeFallbackRewardRuleBundlesForDigest(items: FallbackRewardRuleBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveInviteDigestsFromBundle(items: FallbackRewardRuleBundle[]): InviteDigest[] {
  const out: InviteDigest[] = [];
  for (const item of items) {
    const derived = newInviteDigest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankInviteDigest(item: InviteDigest): number {
  return fallbackRewardRuleBundleWeight(7, true);
}
