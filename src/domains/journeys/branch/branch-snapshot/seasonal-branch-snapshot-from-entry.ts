import { batchedWaitRuleBucket } from "../../wait/entry/batched-wait-rule-policy.js";
import { WaitEntry } from "../../wait/entry/wait-entry.js";
import { SeasonalBranchSnapshot, newSeasonalBranchSnapshot } from "./seasonal-branch-snapshot.js";

export function summarizeWaitEntriesForSnapshot(items: WaitEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveSeasonalBranchSnapshotsFromEntry(items: WaitEntry[]): SeasonalBranchSnapshot[] {
  const out: SeasonalBranchSnapshot[] = [];
  for (const item of items) {
    const derived = newSeasonalBranchSnapshot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planSeasonalBranchSnapshot(item: SeasonalBranchSnapshot): string {
  return batchedWaitRuleBucket(item.netVolume());
}
