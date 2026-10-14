import { TieredTouchpointCheckpoint } from "../../touchpoint/touchpoint-window/tiered-touchpoint-checkpoint.js";
import {
  normalizeTieredTouchpointVarianceCode,
} from "../../touchpoint/touchpoint-window/tiered-touchpoint-variance-policy.js";
import { PathWindow, newPathWindow } from "./path-window.js";

export function summarizeTieredTouchpointCheckpointsForWindow(items: TieredTouchpointCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePathWindowsFromCheckpoint(items: TieredTouchpointCheckpoint[]): PathWindow[] {
  const out: PathWindow[] = [];
  for (const item of items) {
    const derived = newPathWindow(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitPathWindow(item: PathWindow): string {
  return normalizeTieredTouchpointVarianceCode(item.code);
}
