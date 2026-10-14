import { classifyFallbackActivationSlot } from "../../activation/slot/fallback-activation-slot-policy.js";
import { FallbackActivationSlot } from "../../activation/slot/fallback-activation-slot.js";
import { ScheduledFunnelThreshold, newScheduledFunnelThreshold } from "./scheduled-funnel-threshold.js";

export function summarizeFallbackActivationSlotsForThreshold(items: FallbackActivationSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveScheduledFunnelThresholdsFromSlot(items: FallbackActivationSlot[]): ScheduledFunnelThreshold[] {
  const out: ScheduledFunnelThreshold[] = [];
  for (const item of items) {
    const derived = newScheduledFunnelThreshold(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectScheduledFunnelThreshold(item: ScheduledFunnelThreshold): string {
  return classifyFallbackActivationSlot(item.measuredValue());
}
