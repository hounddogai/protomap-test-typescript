import {
  normalizeLenientActivationScheduleCode,
} from "../../activation/activation-window/lenient-activation-schedule-policy.js";
import { TieredActivationWindow } from "../../activation/activation-window/tiered-activation-window.js";
import { FunnelMapping, newFunnelMapping } from "./funnel-mapping.js";

export function summarizeTieredActivationWindowsForMapping(items: TieredActivationWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveFunnelMappingsFromWindow(items: TieredActivationWindow[]): FunnelMapping[] {
  const out: FunnelMapping[] = [];
  for (const item of items) {
    const derived = newFunnelMapping(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeFunnelMapping(item: FunnelMapping): string {
  return normalizeLenientActivationScheduleCode(item.code);
}
