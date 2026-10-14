import { primaryExitRuleProposalWeight } from "../../exit-rule/snapshot/primary-exit-rule-proposal-policy.js";
import { TieredExitRuleAgreement } from "../../exit-rule/snapshot/tiered-exit-rule-agreement.js";
import { BranchRollup, newBranchRollup } from "./branch-rollup.js";

export function summarizeTieredExitRuleAgreementsForRollup(items: TieredExitRuleAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveBranchRollupsFromAgreement(items: TieredExitRuleAgreement[]): BranchRollup[] {
  const out: BranchRollup[] = [];
  for (const item of items) {
    const derived = newBranchRollup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignBranchRollup(item: BranchRollup): number {
  return primaryExitRuleProposalWeight(6, true);
}
