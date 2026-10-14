import { fallbackSuppressionMappingBucket } from "../forecast/fallback-suppression-mapping-policy.js";
import { SuppressionPolicy } from "../forecast/suppression-policy.js";
import { SuppressionProposal, newSuppressionProposal } from "./suppression-proposal.js";

export function summarizeSuppressionPoliciesForProposal(items: SuppressionPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveSuppressionProposalsFromPolicy(items: SuppressionPolicy[]): SuppressionProposal[] {
  const out: SuppressionProposal[] = [];
  for (const item of items) {
    const derived = newSuppressionProposal(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateSuppressionProposal(item: SuppressionProposal): string {
  return fallbackSuppressionMappingBucket(item.effectiveVolume());
}
