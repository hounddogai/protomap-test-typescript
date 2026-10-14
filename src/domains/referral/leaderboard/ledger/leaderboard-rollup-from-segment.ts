import { LenientPayoutSegment } from "../../payout/segment/lenient-payout-segment.js";
import { normalizePayoutSummaryCode } from "../../payout/segment/payout-summary-policy.js";
import { LeaderboardRollup, newLeaderboardRollup } from "./leaderboard-rollup.js";

export function summarizeLenientPayoutSegmentsForRollup(items: LenientPayoutSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLeaderboardRollupsFromSegment(items: LenientPayoutSegment[]): LeaderboardRollup[] {
  const out: LeaderboardRollup[] = [];
  for (const item of items) {
    const derived = newLeaderboardRollup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveLeaderboardRollup(item: LeaderboardRollup): string {
  return normalizePayoutSummaryCode(item.code);
}
