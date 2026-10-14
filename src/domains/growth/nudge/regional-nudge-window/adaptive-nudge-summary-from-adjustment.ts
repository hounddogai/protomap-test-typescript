import { manualRetentionScoreWeight } from "../../retention/retention-adjustment/manual-retention-score-policy.js";
import { PendingRetentionAdjustment } from "../../retention/retention-adjustment/pending-retention-adjustment.js";
import { AdaptiveNudgeSummary, newAdaptiveNudgeSummary } from "./adaptive-nudge-summary.js";

export function summarizePendingRetentionAdjustmentsForSummary(items: PendingRetentionAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveAdaptiveNudgeSummariesFromAdjustment(items: PendingRetentionAdjustment[]): AdaptiveNudgeSummary[] {
  const out: AdaptiveNudgeSummary[] = [];
  for (const item of items) {
    const derived = newAdaptiveNudgeSummary(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectAdaptiveNudgeSummary(item: AdaptiveNudgeSummary): number {
  return manualRetentionScoreWeight(2, true);
}
