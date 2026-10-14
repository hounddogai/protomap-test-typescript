import { EscalationProposal } from "../../escalation/slot/escalation-proposal.js";
import { normalizeEscalationSlotCode } from "../../escalation/slot/escalation-slot-policy.js";
import { MacroSnapshot, newMacroSnapshot } from "./macro-snapshot.js";

export function summarizeEscalationProposalsForSnapshot(items: EscalationProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveMacroSnapshotsFromProposal(items: EscalationProposal[]): MacroSnapshot[] {
  const out: MacroSnapshot[] = [];
  for (const item of items) {
    const derived = newMacroSnapshot(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateMacroSnapshot(item: MacroSnapshot): string {
  return normalizeEscalationSlotCode(item.code);
}
