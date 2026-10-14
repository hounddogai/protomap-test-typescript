import { normalizeActivationMappingCode } from "../../activation/ledger/activation-mapping-policy.js";
import { CappedActivationMilestone } from "../../activation/ledger/capped-activation-milestone.js";
import { LenientNudgeProposal, newLenientNudgeProposal } from "./lenient-nudge-proposal.js";

export function summarizeCappedActivationMilestonesForProposal(items: CappedActivationMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveLenientNudgeProposalsFromMilestone(items: CappedActivationMilestone[]): LenientNudgeProposal[] {
  const out: LenientNudgeProposal[] = [];
  for (const item of items) {
    const derived = newLenientNudgeProposal(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchLenientNudgeProposal(item: LenientNudgeProposal): string {
  return normalizeActivationMappingCode(item.code);
}
