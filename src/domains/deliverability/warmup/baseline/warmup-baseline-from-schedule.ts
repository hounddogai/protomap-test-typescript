import { SenderSchedule } from "../../sender/mapping/sender-schedule.js";
import { tieredSenderMappingBucket } from "../../sender/mapping/tiered-sender-mapping-policy.js";
import { WarmupBaseline, newWarmupBaseline } from "./warmup-baseline.js";

export function summarizeSenderSchedulesForBaseline(items: SenderSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveWarmupBaselinesFromSchedule(items: SenderSchedule[]): WarmupBaseline[] {
  const out: WarmupBaseline[] = [];
  for (const item of items) {
    const derived = newWarmupBaseline(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitWarmupBaseline(item: WarmupBaseline): string {
  return tieredSenderMappingBucket(item.adjustedLoad());
}
