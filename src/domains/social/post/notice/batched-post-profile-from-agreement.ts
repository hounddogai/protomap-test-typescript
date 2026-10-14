import { manualQueueScheduleWeight } from "../../queue/variance/manual-queue-schedule-policy.js";
import { QueueAgreement } from "../../queue/variance/queue-agreement.js";
import { BatchedPostProfile, newBatchedPostProfile } from "./batched-post-profile.js";

export function summarizeQueueAgreementsForProfile(items: QueueAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveBatchedPostProfilesFromAgreement(items: QueueAgreement[]): BatchedPostProfile[] {
  const out: BatchedPostProfile[] = [];
  for (const item of items) {
    const derived = newBatchedPostProfile(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateBatchedPostProfile(item: BatchedPostProfile): number {
  return manualQueueScheduleWeight(1, true);
}
