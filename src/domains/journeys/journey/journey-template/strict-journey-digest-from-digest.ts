import {
  globalEnrollmentReviewBucket,
} from "../../enrollment/tiered-enrollment-digest/global-enrollment-review-policy.js";
import { LenientEnrollmentDigest } from "../../enrollment/tiered-enrollment-digest/lenient-enrollment-digest.js";
import { StrictJourneyDigest, newStrictJourneyDigest } from "./strict-journey-digest.js";

export function summarizeLenientEnrollmentDigestsForDigest(items: LenientEnrollmentDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveStrictJourneyDigestsFromDigest(items: LenientEnrollmentDigest[]): StrictJourneyDigest[] {
  const out: StrictJourneyDigest[] = [];
  for (const item of items) {
    const derived = newStrictJourneyDigest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankStrictJourneyDigest(item: StrictJourneyDigest): string {
  return globalEnrollmentReviewBucket(item.effectiveValue());
}
