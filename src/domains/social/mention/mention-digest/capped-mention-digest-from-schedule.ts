import { classifyWeightedApprovalSchedule } from "../../approval/schedule/weighted-approval-schedule-policy.js";
import { WeightedApprovalSchedule } from "../../approval/schedule/weighted-approval-schedule.js";
import { CappedMentionDigest, newCappedMentionDigest } from "./capped-mention-digest.js";

export function summarizeWeightedApprovalSchedulesForDigest(items: WeightedApprovalSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveCappedMentionDigestsFromSchedule(items: WeightedApprovalSchedule[]): CappedMentionDigest[] {
  const out: CappedMentionDigest[] = [];
  for (const item of items) {
    const derived = newCappedMentionDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateCappedMentionDigest(item: CappedMentionDigest): string {
  return classifyWeightedApprovalSchedule(item.weightedExposure());
}
