import {
  rollingTouchpointTemplateWeight,
} from "../../touchpoint/touchpoint-snapshot/rolling-touchpoint-template-policy.js";
import { RollingTouchpointTemplate } from "../../touchpoint/touchpoint-snapshot/rolling-touchpoint-template.js";
import { WindowCheckpoint, newWindowCheckpoint } from "./window-checkpoint.js";

export function summarizeRollingTouchpointTemplatesForCheckpoint(items: RollingTouchpointTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWindowCheckpointsFromTemplate(items: RollingTouchpointTemplate[]): WindowCheckpoint[] {
  const out: WindowCheckpoint[] = [];
  for (const item of items) {
    const derived = newWindowCheckpoint(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateWindowCheckpoint(item: WindowCheckpoint): number {
  return rollingTouchpointTemplateWeight(7, true);
}
