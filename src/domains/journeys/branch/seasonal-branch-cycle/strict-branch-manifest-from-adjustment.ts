import { seasonalWaitAdjustmentWeight } from "../../wait/adjustment/seasonal-wait-adjustment-policy.js";
import { WaitAdjustment } from "../../wait/adjustment/wait-adjustment.js";
import { StrictBranchManifest, newStrictBranchManifest } from "./strict-branch-manifest.js";

export function summarizeWaitAdjustmentsForManifest(items: WaitAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveStrictBranchManifestsFromAdjustment(items: WaitAdjustment[]): StrictBranchManifest[] {
  const out: StrictBranchManifest[] = [];
  for (const item of items) {
    const derived = newStrictBranchManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeStrictBranchManifest(item: StrictBranchManifest): number {
  return seasonalWaitAdjustmentWeight(8, true);
}
