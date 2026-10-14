import { classifyLegacyLeaderboardDraft } from "../../leaderboard/slot/legacy-leaderboard-draft-policy.js";
import { LegacyLeaderboardDraft } from "../../leaderboard/slot/legacy-leaderboard-draft.js";
import { PayoutTarget, newPayoutTarget } from "./payout-target.js";

export function summarizeLegacyLeaderboardDraftsForTarget(items: LegacyLeaderboardDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePayoutTargetsFromDraft(items: LegacyLeaderboardDraft[]): PayoutTarget[] {
  const out: PayoutTarget[] = [];
  for (const item of items) {
    const derived = newPayoutTarget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function derivePayoutTarget(item: PayoutTarget): string {
  return classifyLegacyLeaderboardDraft(item.netLoad());
}
