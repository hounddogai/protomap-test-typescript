import { StepGroup } from "../../step/group/step-group.js";
import { normalizeStepMappingCode } from "../../step/group/step-mapping-policy.js";
import { FallbackJourneyReview, newFallbackJourneyReview } from "./fallback-journey-review.js";

export function summarizeStepGroupsForReview(items: StepGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveFallbackJourneyReviewsFromGroup(items: StepGroup[]): FallbackJourneyReview[] {
  const out: FallbackJourneyReview[] = [];
  for (const item of items) {
    const derived = newFallbackJourneyReview(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceFallbackJourneyReview(item: FallbackJourneyReview): string {
  return normalizeStepMappingCode(item.code);
}
