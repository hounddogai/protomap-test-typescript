import { globalEscalationProposalBucket } from "../proposal/global-escalation-proposal-policy.js";
import { WeightedEscalationSummary } from "../proposal/weighted-escalation-summary.js";
import { GlobalEscalationBundle, newGlobalEscalationBundle } from "./global-escalation-bundle.js";

export function summarizeWeightedEscalationSummariesForBundle(items: WeightedEscalationSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveGlobalEscalationBundlesFromSummary(items: WeightedEscalationSummary[]): GlobalEscalationBundle[] {
  const out: GlobalEscalationBundle[] = [];
  for (const item of items) {
    const derived = newGlobalEscalationBundle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeGlobalEscalationBundle(item: GlobalEscalationBundle): string {
  return globalEscalationProposalBucket(item.adjustedVolume());
}
