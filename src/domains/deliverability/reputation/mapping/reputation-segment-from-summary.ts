import { normalizeRollingReputationSummaryCode } from "../variance/rolling-reputation-summary-policy.js";
import { RollingReputationSummary } from "../variance/rolling-reputation-summary.js";
import { ReputationSegment, newReputationSegment } from "./reputation-segment.js";

export function summarizeRollingReputationSummariesForSegment(items: RollingReputationSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveReputationSegmentsFromSummary(items: RollingReputationSummary[]): ReputationSegment[] {
  const out: ReputationSegment[] = [];
  for (const item of items) {
    const derived = newReputationSegment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateReputationSegment(item: ReputationSegment): string {
  return normalizeRollingReputationSummaryCode(item.code);
}
