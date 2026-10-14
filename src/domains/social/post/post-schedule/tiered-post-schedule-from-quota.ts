import { BatchedPostQuota } from "../post-quota/batched-post-quota.js";
import { normalizeCappedPostReservationCode } from "../post-quota/capped-post-reservation-policy.js";
import { TieredPostSchedule, newTieredPostSchedule } from "./tiered-post-schedule.js";

export function summarizeBatchedPostQuotasForSchedule(items: BatchedPostQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveTieredPostSchedulesFromQuota(items: BatchedPostQuota[]): TieredPostSchedule[] {
  const out: TieredPostSchedule[] = [];
  for (const item of items) {
    const derived = newTieredPostSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignTieredPostSchedule(item: TieredPostSchedule): string {
  return normalizeCappedPostReservationCode(item.code);
}
