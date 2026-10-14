import { classifyLenientPreferenceWindow } from "../../preference/rollup/lenient-preference-window-policy.js";
import { ScheduledPreferenceSegment } from "../../preference/rollup/scheduled-preference-segment.js";
import { AdaptiveOptOutAdjustment, newAdaptiveOptOutAdjustment } from "./adaptive-opt-out-adjustment.js";

export function summarizeScheduledPreferenceSegmentsForAdjustment(items: ScheduledPreferenceSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveAdaptiveOptOutAdjustmentsFromSegment(items: ScheduledPreferenceSegment[]): AdaptiveOptOutAdjustment[] {
  const out: AdaptiveOptOutAdjustment[] = [];
  for (const item of items) {
    const derived = newAdaptiveOptOutAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveAdaptiveOptOutAdjustment(item: AdaptiveOptOutAdjustment): string {
  return classifyLenientPreferenceWindow(item.adjustedTotal());
}
