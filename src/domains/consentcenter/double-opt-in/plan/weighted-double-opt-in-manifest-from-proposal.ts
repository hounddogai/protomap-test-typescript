import { normalizeDoubleOptInProposalCode } from "../in-review/double-opt-in-proposal-policy.js";
import { DoubleOptInProposal } from "../in-review/double-opt-in-proposal.js";
import { WeightedDoubleOptInManifest, newWeightedDoubleOptInManifest } from "./weighted-double-opt-in-manifest.js";

export function summarizeDoubleOptInProposalsForManifest(items: DoubleOptInProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveWeightedDoubleOptInManifestsFromProposal(items: DoubleOptInProposal[]): WeightedDoubleOptInManifest[] {
  const out: WeightedDoubleOptInManifest[] = [];
  for (const item of items) {
    const derived = newWeightedDoubleOptInManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankWeightedDoubleOptInManifest(item: WeightedDoubleOptInManifest): string {
  return normalizeDoubleOptInProposalCode(item.code);
}
