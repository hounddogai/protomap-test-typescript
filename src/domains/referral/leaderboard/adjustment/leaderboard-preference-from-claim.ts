import {
  classifyDefaultFraudCheckPlan,
} from "../../fraud-check/primary-check-claim/default-fraud-check-plan-policy.js";
import { LegacyFraudCheckClaim } from "../../fraud-check/primary-check-claim/legacy-fraud-check-claim.js";
import { LeaderboardPreference, newLeaderboardPreference } from "./leaderboard-preference.js";

export function summarizeLegacyFraudCheckClaimsForPreference(items: LegacyFraudCheckClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveLeaderboardPreferencesFromClaim(items: LegacyFraudCheckClaim[]): LeaderboardPreference[] {
  const out: LeaderboardPreference[] = [];
  for (const item of items) {
    const derived = newLeaderboardPreference(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeLeaderboardPreference(item: LeaderboardPreference): string {
  return classifyDefaultFraudCheckPlan(item.netValue());
}
