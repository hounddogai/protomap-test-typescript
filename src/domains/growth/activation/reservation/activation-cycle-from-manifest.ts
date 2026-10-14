import { classifyFunnelManifest } from "../../funnel/manifest/funnel-manifest-policy.js";
import { FunnelManifest } from "../../funnel/manifest/funnel-manifest.js";
import { ActivationCycle, newActivationCycle } from "./activation-cycle.js";

export function summarizeFunnelManifestsForCycle(items: FunnelManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveActivationCyclesFromManifest(items: FunnelManifest[]): ActivationCycle[] {
  const out: ActivationCycle[] = [];
  for (const item of items) {
    const derived = newActivationCycle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyActivationCycle(item: ActivationCycle): string {
  return classifyFunnelManifest(item.weightedLoad());
}
