import { normalizeManualTouchpointPolicyCode } from "../../touchpoint/snapshot/manual-touchpoint-policy-policy.js";
import { TouchpointSnapshot } from "../../touchpoint/snapshot/touchpoint-snapshot.js";
import { LenientCreditPreference, newLenientCreditPreference } from "./lenient-credit-preference.js";

export function summarizeTouchpointSnapshotsForPreference(items: TouchpointSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveLenientCreditPreferencesFromSnapshot(items: TouchpointSnapshot[]): LenientCreditPreference[] {
  const out: LenientCreditPreference[] = [];
  for (const item of items) {
    const derived = newLenientCreditPreference(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateLenientCreditPreference(item: LenientCreditPreference): string {
  return normalizeManualTouchpointPolicyCode(item.code);
}
