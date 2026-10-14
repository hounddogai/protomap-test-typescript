import {
  rollingTouchpointTemplateWeight,
} from "../../touchpoint/touchpoint-snapshot/rolling-touchpoint-template-policy.js";
import { StrictTouchpointBaseline } from "../../touchpoint/touchpoint-snapshot/strict-touchpoint-baseline.js";
import { ConversionWindow, newConversionWindow } from "./conversion-window.js";

export function summarizeStrictTouchpointBaselinesForWindow(items: StrictTouchpointBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveConversionWindowsFromBaseline(items: StrictTouchpointBaseline[]): ConversionWindow[] {
  const out: ConversionWindow[] = [];
  for (const item of items) {
    const derived = newConversionWindow(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceConversionWindow(item: ConversionWindow): number {
  return rollingTouchpointTemplateWeight(3, true);
}
