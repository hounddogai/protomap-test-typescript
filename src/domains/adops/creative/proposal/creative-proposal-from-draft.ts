import { CappedFrequencyDraft } from "../../frequency/exception/capped-frequency-draft.js";
import {
  classifyRegionalFrequencyAllocation,
} from "../../frequency/exception/regional-frequency-allocation-policy.js";
import { CreativeProposal, newCreativeProposal } from "./creative-proposal.js";

export function summarizeCappedFrequencyDraftsForProposal(items: CappedFrequencyDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveCreativeProposalsFromDraft(items: CappedFrequencyDraft[]): CreativeProposal[] {
  const out: CreativeProposal[] = [];
  for (const item of items) {
    const derived = newCreativeProposal(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyCreativeProposal(item: CreativeProposal): string {
  return classifyRegionalFrequencyAllocation(item.measuredValue());
}
