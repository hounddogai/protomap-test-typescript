import { normalizePrimaryStreakThresholdCode } from "../../streak/streak-quota/primary-streak-threshold-policy.js";
import { WeightedStreakCycle } from "../../streak/streak-quota/weighted-streak-cycle.js";
import { BadgeRequest, newBadgeRequest } from "./badge-request.js";

export function summarizeWeightedStreakCyclesForRequest(items: WeightedStreakCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveBadgeRequestsFromCycle(items: WeightedStreakCycle[]): BadgeRequest[] {
  const out: BadgeRequest[] = [];
  for (const item of items) {
    const derived = newBadgeRequest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitBadgeRequest(item: BadgeRequest): string {
  return normalizePrimaryStreakThresholdCode(item.code);
}
