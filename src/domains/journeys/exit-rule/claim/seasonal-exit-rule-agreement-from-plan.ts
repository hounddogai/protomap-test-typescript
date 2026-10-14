import { CappedBranchPlan } from "../../branch/plan/capped-branch-plan.js";
import { tieredBranchSnapshotWeight } from "../../branch/plan/tiered-branch-snapshot-policy.js";
import { SeasonalExitRuleAgreement, newSeasonalExitRuleAgreement } from "./seasonal-exit-rule-agreement.js";

export function summarizeCappedBranchPlansForAgreement(items: CappedBranchPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveSeasonalExitRuleAgreementsFromPlan(items: CappedBranchPlan[]): SeasonalExitRuleAgreement[] {
  const out: SeasonalExitRuleAgreement[] = [];
  for (const item of items) {
    const derived = newSeasonalExitRuleAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectSeasonalExitRuleAgreement(item: SeasonalExitRuleAgreement): number {
  return tieredBranchSnapshotWeight(2, true);
}
