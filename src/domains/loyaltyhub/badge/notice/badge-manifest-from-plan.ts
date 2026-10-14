import { classifyStreakPlan } from "../../streak/budget/streak-plan-policy.js";
import { StreakPlan } from "../../streak/budget/streak-plan.js";
import { BadgeManifest, newBadgeManifest } from "./badge-manifest.js";

export function summarizeStreakPlansForManifest(items: StreakPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveBadgeManifestsFromPlan(items: StreakPlan[]): BadgeManifest[] {
  const out: BadgeManifest[] = [];
  for (const item of items) {
    const derived = newBadgeManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileBadgeManifest(item: BadgeManifest): string {
  return classifyStreakPlan(item.measuredValue());
}
