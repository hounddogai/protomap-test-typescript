import { strictWindowPreferenceWeight } from "../audit/strict-window-preference-policy.js";
import { StrictWindowPreference } from "../audit/strict-window-preference.js";
import { WindowClaim, newWindowClaim } from "./window-claim.js";

export function summarizeStrictWindowPreferencesForClaim(items: StrictWindowPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWindowClaimsFromPreference(items: StrictWindowPreference[]): WindowClaim[] {
  const out: WindowClaim[] = [];
  for (const item of items) {
    const derived = newWindowClaim(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyWindowClaim(item: WindowClaim): number {
  return strictWindowPreferenceWeight(2, true);
}
