import { legacyEscalationBatchWeight } from "../../escalation/claim/legacy-escalation-batch-policy.js";
import { LegacyEscalationBatch } from "../../escalation/claim/legacy-escalation-batch.js";
import { LegacyMacroProposal, newLegacyMacroProposal } from "./legacy-macro-proposal.js";

export function summarizeLegacyEscalationBatchesForProposal(items: LegacyEscalationBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyMacroProposalsFromBatch(items: LegacyEscalationBatch[]): LegacyMacroProposal[] {
  const out: LegacyMacroProposal[] = [];
  for (const item of items) {
    const derived = newLegacyMacroProposal(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeLegacyMacroProposal(item: LegacyMacroProposal): number {
  return legacyEscalationBatchWeight(2, true);
}
