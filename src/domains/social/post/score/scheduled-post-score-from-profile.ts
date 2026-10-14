import { CappedPostProfile } from "../profile/capped-post-profile.js";
import { classifyGlobalPostRequest } from "../profile/global-post-request-policy.js";
import { ScheduledPostScore, newScheduledPostScore } from "./scheduled-post-score.js";

export function summarizeCappedPostProfilesForScore(items: CappedPostProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveScheduledPostScoresFromProfile(items: CappedPostProfile[]): ScheduledPostScore[] {
  const out: ScheduledPostScore[] = [];
  for (const item of items) {
    const derived = newScheduledPostScore(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeScheduledPostScore(item: ScheduledPostScore): string {
  return classifyGlobalPostRequest(item.adjustedTotal());
}
