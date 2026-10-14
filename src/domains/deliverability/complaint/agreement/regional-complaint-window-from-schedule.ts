import { classifyDefaultSenderCheckpoint } from "../../sender/mapping/default-sender-checkpoint-policy.js";
import { SenderSchedule } from "../../sender/mapping/sender-schedule.js";
import { RegionalComplaintWindow, newRegionalComplaintWindow } from "./regional-complaint-window.js";

export function summarizeSenderSchedulesForWindow(items: SenderSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveRegionalComplaintWindowsFromSchedule(items: SenderSchedule[]): RegionalComplaintWindow[] {
  const out: RegionalComplaintWindow[] = [];
  for (const item of items) {
    const derived = newRegionalComplaintWindow(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeRegionalComplaintWindow(item: RegionalComplaintWindow): string {
  return classifyDefaultSenderCheckpoint(item.measuredValue());
}
