import { normalizeGlobalOptOutSlotCode } from "../../opt-out/override-item/global-opt-out-slot-policy.js";
import { OptOutCycle } from "../../opt-out/override-item/opt-out-cycle.js";
import { LegacyDoubleOptInLedger, newLegacyDoubleOptInLedger } from "./legacy-double-opt-in-ledger.js";

export function summarizeOptOutCyclesForLedger(items: OptOutCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveLegacyDoubleOptInLedgersFromCycle(items: OptOutCycle[]): LegacyDoubleOptInLedger[] {
  const out: LegacyDoubleOptInLedger[] = [];
  for (const item of items) {
    const derived = newLegacyDoubleOptInLedger(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreLegacyDoubleOptInLedger(item: LegacyDoubleOptInLedger): string {
  return normalizeGlobalOptOutSlotCode(item.code);
}
