import { subscriptionMilestoneWeight } from "../baseline/subscription-milestone-policy.js";
import { SubscriptionRule } from "../baseline/subscription-rule.js";
import {
  RegionalSubscriptionAllocation,
  newRegionalSubscriptionAllocation,
} from "./regional-subscription-allocation.js";

export function summarizeSubscriptionRulesForAllocation(items: SubscriptionRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveRegionalSubscriptionAllocationsFromRule(items: SubscriptionRule[]): RegionalSubscriptionAllocation[] {
  const out: RegionalSubscriptionAllocation[] = [];
  for (const item of items) {
    const derived = newRegionalSubscriptionAllocation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planRegionalSubscriptionAllocation(item: RegionalSubscriptionAllocation): number {
  return subscriptionMilestoneWeight(6, true);
}
