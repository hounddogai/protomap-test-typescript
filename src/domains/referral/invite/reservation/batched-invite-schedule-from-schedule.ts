import { PayoutSchedule } from "../../payout/schedule/payout-schedule.js";
import { payoutTemplateWeight } from "../../payout/schedule/payout-template-policy.js";
import { BatchedInviteSchedule, newBatchedInviteSchedule } from "./batched-invite-schedule.js";

export function summarizePayoutSchedulesForSchedule(items: PayoutSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveBatchedInviteSchedulesFromSchedule(items: PayoutSchedule[]): BatchedInviteSchedule[] {
  const out: BatchedInviteSchedule[] = [];
  for (const item of items) {
    const derived = newBatchedInviteSchedule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeBatchedInviteSchedule(item: BatchedInviteSchedule): number {
  return payoutTemplateWeight(4, true);
}
