import { ManualFlightCheckpoint } from "../cycle/manual-flight-checkpoint.js";
import { classifyRollingFlightScore } from "../cycle/rolling-flight-score-policy.js";
import { LenientFlightManifest, newLenientFlightManifest } from "./lenient-flight-manifest.js";

export function summarizeManualFlightCheckpointsForManifest(items: ManualFlightCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientFlightManifestsFromCheckpoint(items: ManualFlightCheckpoint[]): LenientFlightManifest[] {
  const out: LenientFlightManifest[] = [];
  for (const item of items) {
    const derived = newLenientFlightManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitLenientFlightManifest(item: LenientFlightManifest): string {
  return classifyRollingFlightScore(item.projectedTotal());
}
