import {
  classifyStrictSubscriptionWindow,
} from "../../subscription/subscription-window/strict-subscription-window-policy.js";
import { SubscriptionBudget } from "../../subscription/subscription-window/subscription-budget.js";
import { PreferenceProfile, newPreferenceProfile } from "./preference-profile.js";

export function summarizeSubscriptionBudgetsForProfile(items: SubscriptionBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePreferenceProfilesFromBudget(items: SubscriptionBudget[]): PreferenceProfile[] {
  const out: PreferenceProfile[] = [];
  for (const item of items) {
    const derived = newPreferenceProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function derivePreferenceProfile(item: PreferenceProfile): string {
  return classifyStrictSubscriptionWindow(item.weightedTotal());
}
