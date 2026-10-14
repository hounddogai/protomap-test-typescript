import { normalizeTieredInviteScheduleCode } from "../../invite/digest/tiered-invite-schedule-policy.js";
import { TieredInviteSchedule } from "../../invite/digest/tiered-invite-schedule.js";
import { PendingTierThreshold, newPendingTierThreshold } from "./pending-tier-threshold.js";

export function summarizeTieredInviteSchedulesForThreshold(items: TieredInviteSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingTierThresholdsFromSchedule(items: TieredInviteSchedule[]): PendingTierThreshold[] {
  const out: PendingTierThreshold[] = [];
  for (const item of items) {
    const derived = newPendingTierThreshold(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyPendingTierThreshold(item: PendingTierThreshold): string {
  return normalizeTieredInviteScheduleCode(item.code);
}
