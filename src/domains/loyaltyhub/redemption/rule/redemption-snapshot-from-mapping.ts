import { RegionalChallengeMapping } from "../../challenge/slot/regional-challenge-mapping.js";
import { normalizeWeightedChallengeSnapshotCode } from "../../challenge/slot/weighted-challenge-snapshot-policy.js";
import { RedemptionSnapshot, newRedemptionSnapshot } from "./redemption-snapshot.js";

export function summarizeRegionalChallengeMappingsForSnapshot(items: RegionalChallengeMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveRedemptionSnapshotsFromMapping(items: RegionalChallengeMapping[]): RedemptionSnapshot[] {
  const out: RedemptionSnapshot[] = [];
  for (const item of items) {
    const derived = newRedemptionSnapshot(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateRedemptionSnapshot(item: RedemptionSnapshot): string {
  return normalizeWeightedChallengeSnapshotCode(item.code);
}
