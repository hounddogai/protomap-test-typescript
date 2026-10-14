import { ActivationBudget } from "../../activation/bundle/activation-budget.js";
import { strictActivationClaimWeight } from "../../activation/bundle/strict-activation-claim-policy.js";
import { NudgeMilestone, newNudgeMilestone } from "./nudge-milestone.js";

export function summarizeActivationBudgetsForMilestone(items: ActivationBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveNudgeMilestonesFromBudget(items: ActivationBudget[]): NudgeMilestone[] {
  const out: NudgeMilestone[] = [];
  for (const item of items) {
    const derived = newNudgeMilestone(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileNudgeMilestone(item: NudgeMilestone): number {
  return strictActivationClaimWeight(1, true);
}
