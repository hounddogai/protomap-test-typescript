import { defaultEscalationManifestBucket } from "../../escalation/plan/default-escalation-manifest-policy.js";
import { DefaultEscalationManifest } from "../../escalation/plan/default-escalation-manifest.js";
import { RollingCsatCycle, newRollingCsatCycle } from "./rolling-csat-cycle.js";

export function summarizeDefaultEscalationManifestsForCycle(items: DefaultEscalationManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveRollingCsatCyclesFromManifest(items: DefaultEscalationManifest[]): RollingCsatCycle[] {
  const out: RollingCsatCycle[] = [];
  for (const item of items) {
    const derived = newRollingCsatCycle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleRollingCsatCycle(item: RollingCsatCycle): string {
  return defaultEscalationManifestBucket(item.adjustedVolume());
}
