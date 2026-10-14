import { cappedBranchPlanBucket } from "../../branch/plan/capped-branch-plan-policy.js";
import { TieredBranchSnapshot } from "../../branch/plan/tiered-branch-snapshot.js";
import { LenientJourneyGroup, newLenientJourneyGroup } from "./lenient-journey-group.js";

export function summarizeTieredBranchSnapshotsForGroup(items: TieredBranchSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientJourneyGroupsFromSnapshot(items: TieredBranchSnapshot[]): LenientJourneyGroup[] {
  const out: LenientJourneyGroup[] = [];
  for (const item of items) {
    const derived = newLenientJourneyGroup(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateLenientJourneyGroup(item: LenientJourneyGroup): string {
  return cappedBranchPlanBucket(item.measuredValue());
}
