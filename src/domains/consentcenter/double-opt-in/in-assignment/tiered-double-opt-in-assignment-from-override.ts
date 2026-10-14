import { normalizeOptOutReservationCode } from "../../opt-out/out-override/opt-out-reservation-policy.js";
import { TieredOptOutOverride } from "../../opt-out/out-override/tiered-opt-out-override.js";
import { TieredDoubleOptInAssignment, newTieredDoubleOptInAssignment } from "./tiered-double-opt-in-assignment.js";

export function summarizeTieredOptOutOverridesForAssignment(items: TieredOptOutOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveTieredDoubleOptInAssignmentsFromOverride(items: TieredOptOutOverride[]): TieredDoubleOptInAssignment[] {
  const out: TieredDoubleOptInAssignment[] = [];
  for (const item of items) {
    const derived = newTieredDoubleOptInAssignment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreTieredDoubleOptInAssignment(item: TieredDoubleOptInAssignment): string {
  return normalizeOptOutReservationCode(item.code);
}
