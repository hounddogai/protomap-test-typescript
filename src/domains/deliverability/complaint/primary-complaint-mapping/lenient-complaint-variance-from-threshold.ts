import { classifyPrimaryReputationClaim } from "../../reputation/claim/primary-reputation-claim-policy.js";
import { SeasonalReputationThreshold } from "../../reputation/claim/seasonal-reputation-threshold.js";
import { LenientComplaintVariance, newLenientComplaintVariance } from "./lenient-complaint-variance.js";

export function summarizeSeasonalReputationThresholdsForVariance(items: SeasonalReputationThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLenientComplaintVariancesFromThreshold(items: SeasonalReputationThreshold[]): LenientComplaintVariance[] {
  const out: LenientComplaintVariance[] = [];
  for (const item of items) {
    const derived = newLenientComplaintVariance(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeLenientComplaintVariance(item: LenientComplaintVariance): string {
  return classifyPrimaryReputationClaim(item.netTotal());
}
