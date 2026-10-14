import { adaptiveCsatRequestBucket } from "../../csat/csat-request/adaptive-csat-request-policy.js";
import { CsatCycle } from "../../csat/csat-request/csat-cycle.js";
import { DefaultEscalationManifest, newDefaultEscalationManifest } from "./default-escalation-manifest.js";

export function summarizeCsatCyclesForManifest(items: CsatCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveDefaultEscalationManifestsFromCycle(items: CsatCycle[]): DefaultEscalationManifest[] {
  const out: DefaultEscalationManifest[] = [];
  for (const item of items) {
    const derived = newDefaultEscalationManifest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchDefaultEscalationManifest(item: DefaultEscalationManifest): string {
  return adaptiveCsatRequestBucket(item.adjustedValue());
}
