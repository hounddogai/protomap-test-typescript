import { FraudCheckException } from "../../fraud-check/policy/fraud-check-exception.js";
import { fraudCheckSlotBucket } from "../../fraud-check/policy/fraud-check-slot-policy.js";
import { LeaderboardBundle, newLeaderboardBundle } from "./leaderboard-bundle.js";

export function summarizeFraudCheckExceptionsForBundle(items: FraudCheckException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLeaderboardBundlesFromException(items: FraudCheckException[]): LeaderboardBundle[] {
  const out: LeaderboardBundle[] = [];
  for (const item of items) {
    const derived = newLeaderboardBundle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeLeaderboardBundle(item: LeaderboardBundle): string {
  return fraudCheckSlotBucket(item.netTotal());
}
