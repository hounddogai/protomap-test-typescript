import { adaptiveChallengeBatchWeight } from "../../challenge/summary/adaptive-challenge-batch-policy.js";
import { ChallengeSummary } from "../../challenge/summary/challenge-summary.js";
import { BadgeGroup, newBadgeGroup } from "./badge-group.js";

export function summarizeChallengeSummariesForGroup(items: ChallengeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveBadgeGroupsFromSummary(items: ChallengeSummary[]): BadgeGroup[] {
  const out: BadgeGroup[] = [];
  for (const item of items) {
    const derived = newBadgeGroup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankBadgeGroup(item: BadgeGroup): number {
  return adaptiveChallengeBatchWeight(7, true);
}
