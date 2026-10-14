import { funnelOverrideBucket } from "../../funnel/proposal/funnel-override-policy.js";
import { FunnelWindow } from "../../funnel/proposal/funnel-window.js";
import { FallbackActivationSlot, newFallbackActivationSlot } from "./fallback-activation-slot.js";

export function summarizeFunnelWindowsForSlot(items: FunnelWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveFallbackActivationSlotsFromWindow(items: FunnelWindow[]): FallbackActivationSlot[] {
  const out: FallbackActivationSlot[] = [];
  for (const item of items) {
    const derived = newFallbackActivationSlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveFallbackActivationSlot(item: FallbackActivationSlot): string {
  return funnelOverrideBucket(item.effectiveVolume());
}
