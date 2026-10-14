import { classifyRegionalCreativeReview } from "../../creative/window/regional-creative-review-policy.js";
import { RegionalCreativeReview } from "../../creative/window/regional-creative-review.js";
import { PacingPreference, newPacingPreference } from "./pacing-preference.js";

export function summarizeRegionalCreativeReviewsForPreference(items: RegionalCreativeReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function derivePacingPreferencesFromReview(items: RegionalCreativeReview[]): PacingPreference[] {
  const out: PacingPreference[] = [];
  for (const item of items) {
    const derived = newPacingPreference(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizePacingPreference(item: PacingPreference): string {
  return classifyRegionalCreativeReview(item.weightedTotal());
}
