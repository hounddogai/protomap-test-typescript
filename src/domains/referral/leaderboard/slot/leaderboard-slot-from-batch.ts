import { InviteBatch } from "../../invite/batch/invite-batch.js";
import { normalizeInviteScheduleCode } from "../../invite/batch/invite-schedule-policy.js";
import { LeaderboardSlot, newLeaderboardSlot } from "./leaderboard-slot.js";

export function summarizeInviteBatchesForSlot(items: InviteBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveLeaderboardSlotsFromBatch(items: InviteBatch[]): LeaderboardSlot[] {
  const out: LeaderboardSlot[] = [];
  for (const item of items) {
    const derived = newLeaderboardSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitLeaderboardSlot(item: LeaderboardSlot): string {
  return normalizeInviteScheduleCode(item.code);
}
