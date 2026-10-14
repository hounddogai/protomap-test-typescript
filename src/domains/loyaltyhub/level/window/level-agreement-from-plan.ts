import { StreakPlan } from "../../streak/budget/streak-plan.js";
import { streakProposalBucket } from "../../streak/budget/streak-proposal-policy.js";
import { LevelAgreement, newLevelAgreement } from "./level-agreement.js";

export function summarizeStreakPlansForAgreement(items: StreakPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveLevelAgreementsFromPlan(items: StreakPlan[]): LevelAgreement[] {
  const out: LevelAgreement[] = [];
  for (const item of items) {
    const derived = newLevelAgreement(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitLevelAgreement(item: LevelAgreement): string {
  return streakProposalBucket(item.effectiveLoad());
}
