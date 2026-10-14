import { ManualFlightCheckpoint } from "../../flight/cycle/manual-flight-checkpoint.js";
import { classifyRollingFlightScore } from "../../flight/cycle/rolling-flight-score-policy.js";
import { RollingPacingThreshold, newRollingPacingThreshold } from "./rolling-pacing-threshold.js";

export function summarizeManualFlightCheckpointsForThreshold(items: ManualFlightCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingPacingThresholdsFromCheckpoint(items: ManualFlightCheckpoint[]): RollingPacingThreshold[] {
  const out: RollingPacingThreshold[] = [];
  for (const item of items) {
    const derived = newRollingPacingThreshold(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveRollingPacingThreshold(item: RollingPacingThreshold): string {
  return classifyRollingFlightScore(item.netVolume());
}
