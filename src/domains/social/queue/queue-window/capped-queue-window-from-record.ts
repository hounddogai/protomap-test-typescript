import { classifyLenientPostClaim } from "../../post/record-item/lenient-post-claim-policy.js";
import { ScheduledPostRecord } from "../../post/record-item/scheduled-post-record.js";
import { CappedQueueWindow, newCappedQueueWindow } from "./capped-queue-window.js";

export function summarizeScheduledPostRecordsForWindow(items: ScheduledPostRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveCappedQueueWindowsFromRecord(items: ScheduledPostRecord[]): CappedQueueWindow[] {
  const out: CappedQueueWindow[] = [];
  for (const item of items) {
    const derived = newCappedQueueWindow(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveCappedQueueWindow(item: CappedQueueWindow): string {
  return classifyLenientPostClaim(item.adjustedExposure());
}
