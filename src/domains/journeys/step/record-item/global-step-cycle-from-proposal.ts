import { classifyExitRuleManifest } from "../../exit-rule/proposal/exit-rule-manifest-policy.js";
import { ExitRuleProposal } from "../../exit-rule/proposal/exit-rule-proposal.js";
import { GlobalStepCycle, newGlobalStepCycle } from "./global-step-cycle.js";

export function summarizeExitRuleProposalsForCycle(items: ExitRuleProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalStepCyclesFromProposal(items: ExitRuleProposal[]): GlobalStepCycle[] {
  const out: GlobalStepCycle[] = [];
  for (const item of items) {
    const derived = newGlobalStepCycle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectGlobalStepCycle(item: GlobalStepCycle): string {
  return classifyExitRuleManifest(item.measuredValue());
}
