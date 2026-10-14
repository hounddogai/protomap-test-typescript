import { cohortScoreBucket } from "../schedule/cohort-score-policy.js";
import { CohortScore } from "../schedule/cohort-score.js";
import { CohortAdjustment, newCohortAdjustment } from "./cohort-adjustment.js";

export function summarizeCohortScoresForAdjustment(items: CohortScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveCohortAdjustmentsFromScore(items: CohortScore[]): CohortAdjustment[] {
  const out: CohortAdjustment[] = [];
  for (const item of items) {
    const derived = newCohortAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileCohortAdjustment(item: CohortAdjustment): string {
  return cohortScoreBucket(item.weightedLoad());
}
