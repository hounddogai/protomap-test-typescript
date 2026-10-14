import { activationScheduleBucket } from "../../activation/schedule/activation-schedule-policy.js";
import { ActivationSchedule } from "../../activation/schedule/activation-schedule.js";
import { RetentionNotice, newRetentionNotice } from "./retention-notice.js";

export function summarizeActivationSchedulesForNotice(items: ActivationSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveRetentionNoticesFromSchedule(items: ActivationSchedule[]): RetentionNotice[] {
  const out: RetentionNotice[] = [];
  for (const item of items) {
    const derived = newRetentionNotice(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleRetentionNoticeExtra(item: RetentionNotice): string {
  return activationScheduleBucket(item.netLoad());
}
