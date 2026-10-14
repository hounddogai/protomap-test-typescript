import { PrimaryTouchpointTarget } from "../../touchpoint/preference/primary-touchpoint-target.js";
import { touchpointTargetBucket } from "../../touchpoint/preference/touchpoint-target-policy.js";
import { WindowProfile, newWindowProfile } from "./window-profile.js";

export function summarizePrimaryTouchpointTargetsForProfile(items: PrimaryTouchpointTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveWindowProfilesFromTarget(items: PrimaryTouchpointTarget[]): WindowProfile[] {
  const out: WindowProfile[] = [];
  for (const item of items) {
    const derived = newWindowProfile(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyWindowProfile(item: WindowProfile): string {
  return touchpointTargetBucket(item.netVolume());
}
