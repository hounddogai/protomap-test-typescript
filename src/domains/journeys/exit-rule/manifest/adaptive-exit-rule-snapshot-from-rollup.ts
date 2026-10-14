import { BranchRollup } from "../../branch/request/branch-rollup.js";
import { primaryBranchEstimateWeight } from "../../branch/request/primary-branch-estimate-policy.js";
import { AdaptiveExitRuleSnapshot, newAdaptiveExitRuleSnapshot } from "./adaptive-exit-rule-snapshot.js";

export function summarizeBranchRollupsForSnapshot(items: BranchRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveAdaptiveExitRuleSnapshotsFromRollup(items: BranchRollup[]): AdaptiveExitRuleSnapshot[] {
  const out: AdaptiveExitRuleSnapshot[] = [];
  for (const item of items) {
    const derived = newAdaptiveExitRuleSnapshot(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeAdaptiveExitRuleSnapshot(item: AdaptiveExitRuleSnapshot): number {
  return primaryBranchEstimateWeight(8, true);
}
