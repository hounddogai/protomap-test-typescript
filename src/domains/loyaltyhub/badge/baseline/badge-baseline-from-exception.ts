import { RewardException } from "../../reward/threshold/reward-exception.js";
import { classifyRewardThreshold } from "../../reward/threshold/reward-threshold-policy.js";
import { BadgeBaseline, newBadgeBaseline } from "./badge-baseline.js";

export function summarizeRewardExceptionsForBaseline(items: RewardException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveBadgeBaselinesFromException(items: RewardException[]): BadgeBaseline[] {
  const out: BadgeBaseline[] = [];
  for (const item of items) {
    const derived = newBadgeBaseline(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleBadgeBaseline(item: BadgeBaseline): string {
  return classifyRewardThreshold(item.effectiveTotal());
}
