import { pathRollupBucket } from "../../path/rollup/path-rollup-policy.js";
import { PathSlot } from "../../path/rollup/path-slot.js";
import { WindowScore, newWindowScore } from "./window-score.js";

export function summarizePathSlotsForScore(items: PathSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveWindowScoresFromSlot(items: PathSlot[]): WindowScore[] {
  const out: WindowScore[] = [];
  for (const item of items) {
    const derived = newWindowScore(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectWindowScore(item: WindowScore): string {
  return pathRollupBucket(item.netVolume());
}
