import { defaultExitRuleClaimWeight } from "../../exit-rule/cycle/default-exit-rule-claim-policy.js";
import { TieredExitRuleDigest } from "../../exit-rule/cycle/tiered-exit-rule-digest.js";
import { JourneyEntry, newJourneyEntry } from "./journey-entry.js";

export function summarizeTieredExitRuleDigestsForEntry(items: TieredExitRuleDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveJourneyEntriesFromDigest(items: TieredExitRuleDigest[]): JourneyEntry[] {
  const out: JourneyEntry[] = [];
  for (const item of items) {
    const derived = newJourneyEntry(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchJourneyEntry(item: JourneyEntry): number {
  return defaultExitRuleClaimWeight(9, true);
}
