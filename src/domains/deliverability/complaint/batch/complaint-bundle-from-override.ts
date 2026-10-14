import { normalizeReputationOverrideCode } from "../../reputation/override-item/reputation-override-policy.js";
import { ReputationOverride } from "../../reputation/override-item/reputation-override.js";
import { ComplaintBundle, newComplaintBundle } from "./complaint-bundle.js";

export function summarizeReputationOverridesForBundle(items: ReputationOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveComplaintBundlesFromOverride(items: ReputationOverride[]): ComplaintBundle[] {
  const out: ComplaintBundle[] = [];
  for (const item of items) {
    const derived = newComplaintBundle(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planComplaintBundle(item: ComplaintBundle): string {
  return normalizeReputationOverrideCode(item.code);
}
