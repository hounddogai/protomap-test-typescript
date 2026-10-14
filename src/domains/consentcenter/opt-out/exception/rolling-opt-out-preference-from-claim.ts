import { strictOptOutClaimWeight } from "../out-override/strict-opt-out-claim-policy.js";
import { StrictOptOutClaim } from "../out-override/strict-opt-out-claim.js";
import { RollingOptOutPreference, newRollingOptOutPreference } from "./rolling-opt-out-preference.js";

export function summarizeStrictOptOutClaimsForPreference(items: StrictOptOutClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveRollingOptOutPreferencesFromClaim(items: StrictOptOutClaim[]): RollingOptOutPreference[] {
  const out: RollingOptOutPreference[] = [];
  for (const item of items) {
    const derived = newRollingOptOutPreference(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateRollingOptOutPreference(item: RollingOptOutPreference): number {
  return strictOptOutClaimWeight(6, true);
}
