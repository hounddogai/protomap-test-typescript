import { ManualTouchpointPolicy } from "../../touchpoint/snapshot/manual-touchpoint-policy.js";
import { normalizeTouchpointSnapshotCode } from "../../touchpoint/snapshot/touchpoint-snapshot-policy.js";
import { DefaultPathAdjustment, newDefaultPathAdjustment } from "./default-path-adjustment.js";

export function summarizeManualTouchpointPoliciesForAdjustment(items: ManualTouchpointPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveDefaultPathAdjustmentsFromPolicy(items: ManualTouchpointPolicy[]): DefaultPathAdjustment[] {
  const out: DefaultPathAdjustment[] = [];
  for (const item of items) {
    const derived = newDefaultPathAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchDefaultPathAdjustment(item: DefaultPathAdjustment): string {
  return normalizeTouchpointSnapshotCode(item.code);
}
