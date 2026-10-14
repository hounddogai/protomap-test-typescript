import { lenientWarmupDraftBucket } from "../../warmup/schedule/lenient-warmup-draft-policy.js";
import { WarmupSchedule } from "../../warmup/schedule/warmup-schedule.js";
import { SenderEstimate, newSenderEstimate } from "./sender-estimate.js";

export function summarizeWarmupSchedulesForEstimate(items: WarmupSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveSenderEstimatesFromSchedule(items: WarmupSchedule[]): SenderEstimate[] {
  const out: SenderEstimate[] = [];
  for (const item of items) {
    const derived = newSenderEstimate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitSenderEstimate(item: SenderEstimate): string {
  return lenientWarmupDraftBucket(item.weightedValue());
}
