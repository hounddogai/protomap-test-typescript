import { FunnelVariance } from "../../funnel/variance/funnel-variance.js";
import { seasonalFunnelManifestBucket } from "../../funnel/variance/seasonal-funnel-manifest-policy.js";
import { CohortProposal, newCohortProposal } from "./cohort-proposal.js";

export function summarizeFunnelVariancesForProposal(items: FunnelVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveCohortProposalsFromVariance(items: FunnelVariance[]): CohortProposal[] {
  const out: CohortProposal[] = [];
  for (const item of items) {
    const derived = newCohortProposal(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignCohortProposal(item: CohortProposal): string {
  return seasonalFunnelManifestBucket(item.measuredValue());
}
