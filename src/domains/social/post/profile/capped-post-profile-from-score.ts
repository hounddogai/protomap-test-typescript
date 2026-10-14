import { QueueScore } from "../../queue/queue-record/queue-score.js";
import { regionalQueueRequestWeight } from "../../queue/queue-record/regional-queue-request-policy.js";
import { CappedPostProfile, newCappedPostProfile } from "./capped-post-profile.js";

export function summarizeQueueScoresForProfile(items: QueueScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveCappedPostProfilesFromScore(items: QueueScore[]): CappedPostProfile[] {
  const out: CappedPostProfile[] = [];
  for (const item of items) {
    const derived = newCappedPostProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveCappedPostProfile(item: CappedPostProfile): number {
  return regionalQueueRequestWeight(8, true);
}
