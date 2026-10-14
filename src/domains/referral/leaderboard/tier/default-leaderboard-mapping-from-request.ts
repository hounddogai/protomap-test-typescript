import { defaultPayoutOverrideBucket } from "../../payout/proposal/default-payout-override-policy.js";
import { PayoutRequest } from "../../payout/proposal/payout-request.js";
import { DefaultLeaderboardMapping, newDefaultLeaderboardMapping } from "./default-leaderboard-mapping.js";

export function summarizePayoutRequestsForMapping(items: PayoutRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDefaultLeaderboardMappingsFromRequest(items: PayoutRequest[]): DefaultLeaderboardMapping[] {
  const out: DefaultLeaderboardMapping[] = [];
  for (const item of items) {
    const derived = newDefaultLeaderboardMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveDefaultLeaderboardMapping(item: DefaultLeaderboardMapping): string {
  return defaultPayoutOverrideBucket(item.weightedVolume());
}
