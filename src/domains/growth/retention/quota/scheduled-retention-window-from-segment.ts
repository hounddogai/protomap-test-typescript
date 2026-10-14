import {
  normalizeLenientActivationScheduleCode,
} from "../../activation/activation-window/lenient-activation-schedule-policy.js";
import { WeightedActivationSegment } from "../../activation/activation-window/weighted-activation-segment.js";
import { ScheduledRetentionWindow, newScheduledRetentionWindow } from "./scheduled-retention-window.js";

export function summarizeWeightedActivationSegmentsForWindow(items: WeightedActivationSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveScheduledRetentionWindowsFromSegment(items: WeightedActivationSegment[]): ScheduledRetentionWindow[] {
  const out: ScheduledRetentionWindow[] = [];
  for (const item of items) {
    const derived = newScheduledRetentionWindow(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateScheduledRetentionWindow(item: ScheduledRetentionWindow): string {
  return normalizeLenientActivationScheduleCode(item.code);
}
