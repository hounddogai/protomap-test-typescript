import { ConversionCheckpoint } from "../../conversion/conversion-threshold/conversion-checkpoint.js";
import {
  weightedConversionAuditWeight,
} from "../../conversion/conversion-threshold/weighted-conversion-audit-policy.js";
import { PathRollup, newPathRollup } from "./path-rollup.js";

export function summarizeConversionCheckpointsForRollup(items: ConversionCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePathRollupsFromCheckpoint(items: ConversionCheckpoint[]): PathRollup[] {
  const out: PathRollup[] = [];
  for (const item of items) {
    const derived = newPathRollup(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocatePathRollup(item: PathRollup): number {
  return weightedConversionAuditWeight(3, true);
}
