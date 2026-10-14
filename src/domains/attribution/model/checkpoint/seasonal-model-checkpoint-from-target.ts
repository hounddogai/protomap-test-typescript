import { PrimaryTouchpointTarget } from "../../touchpoint/preference/primary-touchpoint-target.js";
import { normalizeTouchpointSummaryCode } from "../../touchpoint/preference/touchpoint-summary-policy.js";
import { SeasonalModelCheckpoint, newSeasonalModelCheckpoint } from "./seasonal-model-checkpoint.js";

export function summarizePrimaryTouchpointTargetsForCheckpoint(items: PrimaryTouchpointTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveSeasonalModelCheckpointsFromTarget(items: PrimaryTouchpointTarget[]): SeasonalModelCheckpoint[] {
  const out: SeasonalModelCheckpoint[] = [];
  for (const item of items) {
    const derived = newSeasonalModelCheckpoint(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankSeasonalModelCheckpoint(item: SeasonalModelCheckpoint): string {
  return normalizeTouchpointSummaryCode(item.code);
}
