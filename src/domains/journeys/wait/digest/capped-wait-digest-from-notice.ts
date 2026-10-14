import { branchReservationWeight } from "../../branch/snapshot/branch-reservation-policy.js";
import { TieredBranchNotice } from "../../branch/snapshot/tiered-branch-notice.js";
import { CappedWaitDigest, newCappedWaitDigest } from "./capped-wait-digest.js";

export function summarizeTieredBranchNoticesForDigest(items: TieredBranchNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveCappedWaitDigestsFromNotice(items: TieredBranchNotice[]): CappedWaitDigest[] {
  const out: CappedWaitDigest[] = [];
  for (const item of items) {
    const derived = newCappedWaitDigest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeCappedWaitDigest(item: CappedWaitDigest): number {
  return branchReservationWeight(9, true);
}
