import { scheduledRetentionScoreBucket } from "../../retention/score/scheduled-retention-score-policy.js";
import { ScheduledRetentionScore } from "../../retention/score/scheduled-retention-score.js";
import { CappedCohortBundle, newCappedCohortBundle } from "./capped-cohort-bundle.js";

export function summarizeScheduledRetentionScoresForBundle(items: ScheduledRetentionScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedCohortBundlesFromScore(items: ScheduledRetentionScore[]): CappedCohortBundle[] {
  const out: CappedCohortBundle[] = [];
  for (const item of items) {
    const derived = newCappedCohortBundle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignCappedCohortBundle(item: CappedCohortBundle): string {
  return scheduledRetentionScoreBucket(item.projectedExposure());
}
