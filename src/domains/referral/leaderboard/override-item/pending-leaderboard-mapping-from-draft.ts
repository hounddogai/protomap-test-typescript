import { inviteDraftBucket } from "../../invite/draft/invite-draft-policy.js";
import { InviteDraft } from "../../invite/draft/invite-draft.js";
import { PendingLeaderboardMapping, newPendingLeaderboardMapping } from "./pending-leaderboard-mapping.js";

export function summarizeInviteDraftsForMapping(items: InviteDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingLeaderboardMappingsFromDraft(items: InviteDraft[]): PendingLeaderboardMapping[] {
  const out: PendingLeaderboardMapping[] = [];
  for (const item of items) {
    const derived = newPendingLeaderboardMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignPendingLeaderboardMapping(item: PendingLeaderboardMapping): string {
  return inviteDraftBucket(item.effectiveLoad());
}
