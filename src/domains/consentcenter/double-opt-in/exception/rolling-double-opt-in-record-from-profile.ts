import { batchedDoubleOptInPlanWeight } from "../in-profile/batched-double-opt-in-plan-policy.js";
import { TieredDoubleOptInProfile } from "../in-profile/tiered-double-opt-in-profile.js";
import { RollingDoubleOptInRecord, newRollingDoubleOptInRecord } from "./rolling-double-opt-in-record.js";

export function summarizeTieredDoubleOptInProfilesForRecord(items: TieredDoubleOptInProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveRollingDoubleOptInRecordsFromProfile(items: TieredDoubleOptInProfile[]): RollingDoubleOptInRecord[] {
  const out: RollingDoubleOptInRecord[] = [];
  for (const item of items) {
    const derived = newRollingDoubleOptInRecord(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateRollingDoubleOptInRecord(item: RollingDoubleOptInRecord): number {
  return batchedDoubleOptInPlanWeight(9, true);
}
