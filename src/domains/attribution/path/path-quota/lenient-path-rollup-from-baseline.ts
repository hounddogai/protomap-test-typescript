import {
  normalizeStrictTouchpointBaselineCode,
} from "../../touchpoint/touchpoint-snapshot/strict-touchpoint-baseline-policy.js";
import { StrictTouchpointBaseline } from "../../touchpoint/touchpoint-snapshot/strict-touchpoint-baseline.js";
import { LenientPathRollup, newLenientPathRollup } from "./lenient-path-rollup.js";

export function summarizeStrictTouchpointBaselinesForRollup(items: StrictTouchpointBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveLenientPathRollupsFromBaseline(items: StrictTouchpointBaseline[]): LenientPathRollup[] {
  const out: LenientPathRollup[] = [];
  for (const item of items) {
    const derived = newLenientPathRollup(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileLenientPathRollup(item: LenientPathRollup): string {
  return normalizeStrictTouchpointBaselineCode(item.code);
}
