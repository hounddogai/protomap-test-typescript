import {
  normalizeRegionalSuppressionProfileCode,
} from "../../suppression/default-suppression-profile/regional-suppression-profile-policy.js";
import {
  RegionalSuppressionReview,
} from "../../suppression/default-suppression-profile/regional-suppression-review.js";
import { PrimaryPreferenceBaseline, newPrimaryPreferenceBaseline } from "./primary-preference-baseline.js";

export function summarizeRegionalSuppressionReviewsForBaseline(items: RegionalSuppressionReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePrimaryPreferenceBaselinesFromReview(items: RegionalSuppressionReview[]): PrimaryPreferenceBaseline[] {
  const out: PrimaryPreferenceBaseline[] = [];
  for (const item of items) {
    const derived = newPrimaryPreferenceBaseline(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planPrimaryPreferenceBaseline(item: PrimaryPreferenceBaseline): string {
  return normalizeRegionalSuppressionProfileCode(item.code);
}
