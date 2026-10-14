import { TieredLeaderboardMapping } from "../../leaderboard/leaderboard-adjustment/tiered-leaderboard-mapping.js";
import { InviteLedger, newInviteLedger } from "./invite-ledger.js";

export function summarizeTieredLeaderboardMappingsForLedger(items: TieredLeaderboardMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveInviteLedgersFromMapping(items: TieredLeaderboardMapping[]): InviteLedger[] {
  const out: InviteLedger[] = [];
  for (const item of items) {
    const derived = newInviteLedger(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}
