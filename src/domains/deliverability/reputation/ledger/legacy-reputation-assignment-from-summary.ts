import { AdaptiveReputationSummary } from "../summary/adaptive-reputation-summary.js";
import { normalizeWeightedReputationSummaryCode } from "../summary/weighted-reputation-summary-policy.js";
import { LegacyReputationAssignment, newLegacyReputationAssignment } from "./legacy-reputation-assignment.js";

export function summarizeAdaptiveReputationSummariesForAssignment(items: AdaptiveReputationSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveLegacyReputationAssignmentsFromSummary(items: AdaptiveReputationSummary[]): LegacyReputationAssignment[] {
  const out: LegacyReputationAssignment[] = [];
  for (const item of items) {
    const derived = newLegacyReputationAssignment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankLegacyReputationAssignment(item: LegacyReputationAssignment): string {
  return normalizeWeightedReputationSummaryCode(item.code);
}
