import { classifySeasonalPathBatch } from "../../path/variance/seasonal-path-batch-policy.js";
import { StrictPathProposal } from "../../path/variance/strict-path-proposal.js";
import { ManualConversionTier, newManualConversionTier } from "./manual-conversion-tier.js";

export function summarizeStrictPathProposalsForTier(items: StrictPathProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveManualConversionTiersFromProposal(items: StrictPathProposal[]): ManualConversionTier[] {
  const out: ManualConversionTier[] = [];
  for (const item of items) {
    const derived = newManualConversionTier(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveManualConversionTierExtra(item: ManualConversionTier): string {
  return classifySeasonalPathBatch(item.effectiveLoad());
}
