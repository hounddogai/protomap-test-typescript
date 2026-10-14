import { LegacyMacroProposal } from "../../macro/profile/legacy-macro-proposal.js";
import { primaryMacroEstimateBucket } from "../../macro/profile/primary-macro-estimate-policy.js";
import { WeightedDeflectionEntry, newWeightedDeflectionEntry } from "./weighted-deflection-entry.js";

export function summarizeLegacyMacroProposalsForEntry(items: LegacyMacroProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveWeightedDeflectionEntriesFromProposal(items: LegacyMacroProposal[]): WeightedDeflectionEntry[] {
  const out: WeightedDeflectionEntry[] = [];
  for (const item of items) {
    const derived = newWeightedDeflectionEntry(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeWeightedDeflectionEntry(item: WeightedDeflectionEntry): string {
  return primaryMacroEstimateBucket(item.weightedVolume());
}
