import { TieredWaitDigest } from "../snapshot/tiered-wait-digest.js";
import { normalizeWeightedWaitWindowCode } from "../snapshot/weighted-wait-window-policy.js";
import { DefaultWaitTarget, newDefaultWaitTarget } from "./default-wait-target.js";

export function summarizeTieredWaitDigestsForTarget(items: TieredWaitDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveDefaultWaitTargetsFromDigest(items: TieredWaitDigest[]): DefaultWaitTarget[] {
  const out: DefaultWaitTarget[] = [];
  for (const item of items) {
    const derived = newDefaultWaitTarget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planDefaultWaitTarget(item: DefaultWaitTarget): string {
  return normalizeWeightedWaitWindowCode(item.code);
}
