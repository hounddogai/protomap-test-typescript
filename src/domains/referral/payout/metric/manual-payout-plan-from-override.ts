import {
  normalizeScheduledLeaderboardOverrideCode,
} from "../../leaderboard/override-item/scheduled-leaderboard-override-policy.js";
import { ScheduledLeaderboardOverride } from "../../leaderboard/override-item/scheduled-leaderboard-override.js";
import { ManualPayoutPlan, newManualPayoutPlan } from "./manual-payout-plan.js";

export function summarizeScheduledLeaderboardOverridesForPlan(items: ScheduledLeaderboardOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveManualPayoutPlansFromOverride(items: ScheduledLeaderboardOverride[]): ManualPayoutPlan[] {
  const out: ManualPayoutPlan[] = [];
  for (const item of items) {
    const derived = newManualPayoutPlan(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitManualPayoutPlan(item: ManualPayoutPlan): string {
  return normalizeScheduledLeaderboardOverrideCode(item.code);
}
