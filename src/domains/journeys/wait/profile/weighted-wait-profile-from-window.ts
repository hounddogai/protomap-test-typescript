import { cappedWaitWindowWeight } from "../window/capped-wait-window-policy.js";
import { CappedWaitWindow } from "../window/capped-wait-window.js";
import { WeightedWaitProfile, newWeightedWaitProfile } from "./weighted-wait-profile.js";

export function summarizeCappedWaitWindowsForProfile(items: CappedWaitWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveWeightedWaitProfilesFromWindow(items: CappedWaitWindow[]): WeightedWaitProfile[] {
  const out: WeightedWaitProfile[] = [];
  for (const item of items) {
    const derived = newWeightedWaitProfile(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileWeightedWaitProfile(item: WeightedWaitProfile): number {
  return cappedWaitWindowWeight(7, true);
}
