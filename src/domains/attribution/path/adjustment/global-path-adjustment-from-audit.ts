import { AdaptiveModelAudit } from "../../model/adjustment/adaptive-model-audit.js";
import { strictModelAdjustmentBucket } from "../../model/adjustment/strict-model-adjustment-policy.js";
import { GlobalPathAdjustment, newGlobalPathAdjustment } from "./global-path-adjustment.js";

export function summarizeAdaptiveModelAuditsForAdjustment(items: AdaptiveModelAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveGlobalPathAdjustmentsFromAudit(items: AdaptiveModelAudit[]): GlobalPathAdjustment[] {
  const out: GlobalPathAdjustment[] = [];
  for (const item of items) {
    const derived = newGlobalPathAdjustment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeGlobalPathAdjustment(item: GlobalPathAdjustment): string {
  return strictModelAdjustmentBucket(item.projectedVolume());
}
