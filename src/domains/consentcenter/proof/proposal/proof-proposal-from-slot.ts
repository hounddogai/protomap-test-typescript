import { normalizeDoubleOptInBundleCode } from "../../double-opt-in/bundle/double-opt-in-bundle-policy.js";
import { DoubleOptInSlot } from "../../double-opt-in/bundle/double-opt-in-slot.js";
import { ProofProposal, newProofProposal } from "./proof-proposal.js";

export function summarizeDoubleOptInSlotsForProposal(items: DoubleOptInSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveProofProposalsFromSlot(items: DoubleOptInSlot[]): ProofProposal[] {
  const out: ProofProposal[] = [];
  for (const item of items) {
    const derived = newProofProposal(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchProofProposal(item: ProofProposal): string {
  return normalizeDoubleOptInBundleCode(item.code);
}
