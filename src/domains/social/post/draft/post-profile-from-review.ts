import { normalizePostPreferenceCode } from "../proposal/post-preference-policy.js";
import { PostReview } from "../proposal/post-review.js";
import { PostProfile, newPostProfile } from "./post-profile.js";

export function summarizePostReviewsForProfile(items: PostReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePostProfilesFromReview(items: PostReview[]): PostProfile[] {
  const out: PostProfile[] = [];
  for (const item of items) {
    const derived = newPostProfile(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balancePostProfile(item: PostProfile): string {
  return normalizePostPreferenceCode(item.code);
}
