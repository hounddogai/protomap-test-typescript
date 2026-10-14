import { cappedTicketViewThresholdBucket } from "../../ticket-view/batch/capped-ticket-view-threshold-policy.js";
import { TicketViewWindow } from "../../ticket-view/batch/ticket-view-window.js";
import { LenientDeflectionManifest, newLenientDeflectionManifest } from "./lenient-deflection-manifest.js";

export function summarizeTicketViewWindowsForManifest(items: TicketViewWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveLenientDeflectionManifestsFromWindow(items: TicketViewWindow[]): LenientDeflectionManifest[] {
  const out: LenientDeflectionManifest[] = [];
  for (const item of items) {
    const derived = newLenientDeflectionManifest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchLenientDeflectionManifest(item: LenientDeflectionManifest): string {
  return cappedTicketViewThresholdBucket(item.weightedVolume());
}
