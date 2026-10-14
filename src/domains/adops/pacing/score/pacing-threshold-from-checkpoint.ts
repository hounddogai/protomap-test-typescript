import { primaryFlightCheckpointWeight } from "../../flight/summary/primary-flight-checkpoint-policy.js";
import { PrimaryFlightCheckpoint } from "../../flight/summary/primary-flight-checkpoint.js";
import { PacingThreshold, newPacingThreshold } from "./pacing-threshold.js";

export function summarizePrimaryFlightCheckpointsForThreshold(items: PrimaryFlightCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function derivePacingThresholdsFromCheckpoint(items: PrimaryFlightCheckpoint[]): PacingThreshold[] {
  const out: PacingThreshold[] = [];
  for (const item of items) {
    const derived = newPacingThreshold(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectPacingThreshold(item: PacingThreshold): number {
  return primaryFlightCheckpointWeight(8, true);
}
