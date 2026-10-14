import { normalizeWaitBundleCode } from "../../wait/checkpoint/wait-bundle-policy.js";
import { WaitBundle } from "../../wait/checkpoint/wait-bundle.js";
import { ExitRuleProposal, newExitRuleProposal } from "./exit-rule-proposal.js";

export function summarizeWaitBundlesForProposal(items: WaitBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveExitRuleProposalsFromBundle(items: WaitBundle[]): ExitRuleProposal[] {
  const out: ExitRuleProposal[] = [];
  for (const item of items) {
    const derived = newExitRuleProposal(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreExitRuleProposal(item: ExitRuleProposal): string {
  return normalizeWaitBundleCode(item.code);
}
