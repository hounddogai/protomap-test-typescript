import { classifyTouchpointAudit } from "../../touchpoint/window/touchpoint-audit-policy.js";
import { TouchpointCheckpoint } from "../../touchpoint/window/touchpoint-checkpoint.js";
import { ConversionScore, newConversionScore } from "./conversion-score.js";

export function summarizeTouchpointCheckpointsForScore(items: TouchpointCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveConversionScoresFromCheckpoint(items: TouchpointCheckpoint[]): ConversionScore[] {
  const out: ConversionScore[] = [];
  for (const item of items) {
    const derived = newConversionScore(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankConversionScore(item: ConversionScore): string {
  return classifyTouchpointAudit(item.netVolume());
}
