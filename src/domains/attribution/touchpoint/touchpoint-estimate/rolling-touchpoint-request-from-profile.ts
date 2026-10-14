import { ManualConversionProfile } from "../../conversion/profile/manual-conversion-profile.js";
import { rollingConversionReviewWeight } from "../../conversion/profile/rolling-conversion-review-policy.js";
import { RollingTouchpointRequest, newRollingTouchpointRequest } from "./rolling-touchpoint-request.js";

export function summarizeManualConversionProfilesForRequest(items: ManualConversionProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveRollingTouchpointRequestsFromProfile(items: ManualConversionProfile[]): RollingTouchpointRequest[] {
  const out: RollingTouchpointRequest[] = [];
  for (const item of items) {
    const derived = newRollingTouchpointRequest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveRollingTouchpointRequest(item: RollingTouchpointRequest): number {
  return rollingConversionReviewWeight(5, true);
}
