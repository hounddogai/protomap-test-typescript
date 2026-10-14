import { normalizeSubscriptionRollupCode } from "../bundle/subscription-rollup-policy.js";
import { SubscriptionRollup } from "../bundle/subscription-rollup.js";
import {
  ScheduledSubscriptionOverride,
  newScheduledSubscriptionOverride,
} from "./scheduled-subscription-override.js";

export function summarizeSubscriptionRollupsForOverride(items: SubscriptionRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveScheduledSubscriptionOverridesFromRollup(items: SubscriptionRollup[]): ScheduledSubscriptionOverride[] {
  const out: ScheduledSubscriptionOverride[] = [];
  for (const item of items) {
    const derived = newScheduledSubscriptionOverride(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateScheduledSubscriptionOverride(item: ScheduledSubscriptionOverride): string {
  return normalizeSubscriptionRollupCode(item.code);
}
