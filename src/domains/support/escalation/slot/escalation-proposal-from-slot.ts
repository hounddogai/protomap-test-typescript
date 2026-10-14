import { defaultMacroSegmentBucket } from "../../macro/segment/default-macro-segment-policy.js";
import { MacroSlot } from "../../macro/segment/macro-slot.js";
import { EscalationProposal, newEscalationProposal } from "./escalation-proposal.js";

export function summarizeMacroSlotsForProposal(items: MacroSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveEscalationProposalsFromSlot(items: MacroSlot[]): EscalationProposal[] {
  const out: EscalationProposal[] = [];
  for (const item of items) {
    const derived = newEscalationProposal(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileEscalationProposal(item: EscalationProposal): string {
  return defaultMacroSegmentBucket(item.measuredValue());
}
