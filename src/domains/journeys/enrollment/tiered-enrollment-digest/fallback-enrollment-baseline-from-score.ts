import { StepScore } from "../../step/bundle/step-score.js";
import { strictStepMilestoneBucket } from "../../step/bundle/strict-step-milestone-policy.js";
import { FallbackEnrollmentBaseline, newFallbackEnrollmentBaseline } from "./fallback-enrollment-baseline.js";

export function summarizeStepScoresForBaseline(items: StepScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFallbackEnrollmentBaselinesFromScore(items: StepScore[]): FallbackEnrollmentBaseline[] {
  const out: FallbackEnrollmentBaseline[] = [];
  for (const item of items) {
    const derived = newFallbackEnrollmentBaseline(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankFallbackEnrollmentBaseline(item: FallbackEnrollmentBaseline): string {
  return strictStepMilestoneBucket(item.adjustedTotal());
}
