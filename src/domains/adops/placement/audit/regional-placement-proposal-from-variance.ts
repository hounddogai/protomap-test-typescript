import { classifyManualPacingVariance } from "../../pacing/estimate/manual-pacing-variance-policy.js";
import { PrimaryPacingVariance } from "../../pacing/estimate/primary-pacing-variance.js";
import { RegionalPlacementProposal, newRegionalPlacementProposal } from "./regional-placement-proposal.js";

export function summarizePrimaryPacingVariancesForProposal(items: PrimaryPacingVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveRegionalPlacementProposalsFromVariance(items: PrimaryPacingVariance[]): RegionalPlacementProposal[] {
  const out: RegionalPlacementProposal[] = [];
  for (const item of items) {
    const derived = newRegionalPlacementProposal(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleRegionalPlacementProposal(item: RegionalPlacementProposal): string {
  return classifyManualPacingVariance(item.projectedExposure());
}
