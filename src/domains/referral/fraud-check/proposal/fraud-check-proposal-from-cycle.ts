import { legacyRewardRuleCycleWeight } from "../../reward-rule/cycle/legacy-reward-rule-cycle-policy.js";
import { LegacyRewardRuleCycle } from "../../reward-rule/cycle/legacy-reward-rule-cycle.js";
import { FraudCheckProposal, newFraudCheckProposal } from "./fraud-check-proposal.js";

export function summarizeLegacyRewardRuleCyclesForProposal(items: LegacyRewardRuleCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveFraudCheckProposalsFromCycle(items: LegacyRewardRuleCycle[]): FraudCheckProposal[] {
  const out: FraudCheckProposal[] = [];
  for (const item of items) {
    const derived = newFraudCheckProposal(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveFraudCheckProposal(item: FraudCheckProposal): number {
  return legacyRewardRuleCycleWeight(5, true);
}
