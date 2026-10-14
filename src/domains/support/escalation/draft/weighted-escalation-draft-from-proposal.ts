import { classifyMacroRequest } from "../../macro/forecast/macro-request-policy.js";
import { StrictMacroProposal } from "../../macro/forecast/strict-macro-proposal.js";
import { WeightedEscalationDraft, newWeightedEscalationDraft } from "./weighted-escalation-draft.js";

export function summarizeStrictMacroProposalsForDraft(items: StrictMacroProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveWeightedEscalationDraftsFromProposal(items: StrictMacroProposal[]): WeightedEscalationDraft[] {
  const out: WeightedEscalationDraft[] = [];
  for (const item of items) {
    const derived = newWeightedEscalationDraft(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeWeightedEscalationDraft(item: WeightedEscalationDraft): string {
  return classifyMacroRequest(item.projectedVolume());
}
