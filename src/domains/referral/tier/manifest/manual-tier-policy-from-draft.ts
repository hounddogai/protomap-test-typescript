import { classifyLeaderboardSlot } from "../../leaderboard/slot/leaderboard-slot-policy.js";
import { LegacyLeaderboardDraft } from "../../leaderboard/slot/legacy-leaderboard-draft.js";
import { ManualTierPolicy, newManualTierPolicy } from "./manual-tier-policy.js";

export function summarizeLegacyLeaderboardDraftsForPolicy(items: LegacyLeaderboardDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveManualTierPoliciesFromDraft(items: LegacyLeaderboardDraft[]): ManualTierPolicy[] {
  const out: ManualTierPolicy[] = [];
  for (const item of items) {
    const derived = newManualTierPolicy(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectManualTierPolicy(item: ManualTierPolicy): string {
  return classifyLeaderboardSlot(item.effectiveLoad());
}
