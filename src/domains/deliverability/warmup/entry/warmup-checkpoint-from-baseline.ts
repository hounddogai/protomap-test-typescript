import { normalizeStrictWarmupManifestCode } from "../baseline/strict-warmup-manifest-policy.js";
import { WarmupBaseline } from "../baseline/warmup-baseline.js";
import { WarmupCheckpoint, newWarmupCheckpoint } from "./warmup-checkpoint.js";

export function summarizeWarmupBaselinesForCheckpoint(items: WarmupBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveWarmupCheckpointsFromBaseline(items: WarmupBaseline[]): WarmupCheckpoint[] {
  const out: WarmupCheckpoint[] = [];
  for (const item of items) {
    const derived = newWarmupCheckpoint(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileWarmupCheckpoint(item: WarmupCheckpoint): string {
  return normalizeStrictWarmupManifestCode(item.code);
}
