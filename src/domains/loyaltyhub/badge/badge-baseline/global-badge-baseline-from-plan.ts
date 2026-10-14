import { challengePlanWeight } from "../../challenge/plan/challenge-plan-policy.js";
import { ChallengePlan } from "../../challenge/plan/challenge-plan.js";
import { classifyTieredBadgePlan } from "../plan/tiered-badge-plan-policy.js";
import { TieredBadgePlan } from "../plan/tiered-badge-plan.js";
import { GlobalBadgeBaseline, newGlobalBadgeBaseline } from "./global-badge-baseline.js";

export function summarizeChallengePlansForBaseline(items: ChallengePlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveGlobalBadgeBaselinesFromPlan(items: ChallengePlan[]): GlobalBadgeBaseline[] {
  const out: GlobalBadgeBaseline[] = [];
  for (const item of items) {
    const derived = newGlobalBadgeBaseline(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitGlobalBadgeBaseline(item: GlobalBadgeBaseline): number {
  return challengePlanWeight(6, true);
}

export function summarizeTieredBadgePlansForBaseline(items: TieredBadgePlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveGlobalBadgeBaselinesFromPlanExtra(items: TieredBadgePlan[]): GlobalBadgeBaseline[] {
  const out: GlobalBadgeBaseline[] = [];
  for (const item of items) {
    const derived = newGlobalBadgeBaseline(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileGlobalBadgeBaseline(item: GlobalBadgeBaseline): string {
  return classifyTieredBadgePlan(item.netLoad());
}
