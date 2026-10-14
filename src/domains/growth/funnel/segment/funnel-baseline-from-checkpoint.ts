import {
  primaryActivationDigestWeight,
} from "../../activation/activation-digest/primary-activation-digest-policy.js";
import { TieredActivationCheckpoint } from "../../activation/activation-digest/tiered-activation-checkpoint.js";
import { FunnelBaseline, newFunnelBaseline } from "./funnel-baseline.js";

export function summarizeTieredActivationCheckpointsForBaseline(items: TieredActivationCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveFunnelBaselinesFromCheckpoint(items: TieredActivationCheckpoint[]): FunnelBaseline[] {
  const out: FunnelBaseline[] = [];
  for (const item of items) {
    const derived = newFunnelBaseline(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveFunnelBaseline(item: FunnelBaseline): number {
  return primaryActivationDigestWeight(9, true);
}
