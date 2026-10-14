import {
  lenientDeflectionReservationWeight,
} from "../../deflection/baseline/lenient-deflection-reservation-policy.js";
import { ScheduledDeflectionRecord } from "../../deflection/baseline/scheduled-deflection-record.js";
import { TieredMacroAgreement, newTieredMacroAgreement } from "./tiered-macro-agreement.js";

export function summarizeScheduledDeflectionRecordsForAgreement(items: ScheduledDeflectionRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveTieredMacroAgreementsFromRecord(items: ScheduledDeflectionRecord[]): TieredMacroAgreement[] {
  const out: TieredMacroAgreement[] = [];
  for (const item of items) {
    const derived = newTieredMacroAgreement(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectTieredMacroAgreement(item: TieredMacroAgreement): number {
  return lenientDeflectionReservationWeight(3, true);
}
