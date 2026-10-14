import { classifyGlobalCreativeException } from "../../creative/bundle/global-creative-exception-policy.js";
import { GlobalCreativeException } from "../../creative/bundle/global-creative-exception.js";
import { RollingPlacementNotice, newRollingPlacementNotice } from "./rolling-placement-notice.js";

export function summarizeGlobalCreativeExceptionsForNotice(items: GlobalCreativeException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveRollingPlacementNoticesFromException(items: GlobalCreativeException[]): RollingPlacementNotice[] {
  const out: RollingPlacementNotice[] = [];
  for (const item of items) {
    const derived = newRollingPlacementNotice(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeRollingPlacementNotice(item: RollingPlacementNotice): string {
  return classifyGlobalCreativeException(item.adjustedExposure());
}
