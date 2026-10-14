import { classifyGlobalPreferenceSchedule } from "../../preference/bundle/global-preference-schedule-policy.js";
import { GlobalPreferenceSchedule } from "../../preference/bundle/global-preference-schedule.js";
import { ScheduledDoubleOptInLedger, newScheduledDoubleOptInLedger } from "./scheduled-double-opt-in-ledger.js";

export function summarizeGlobalPreferenceSchedulesForLedger(items: GlobalPreferenceSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveScheduledDoubleOptInLedgersFromSchedule(items: GlobalPreferenceSchedule[]): ScheduledDoubleOptInLedger[] {
  const out: ScheduledDoubleOptInLedger[] = [];
  for (const item of items) {
    const derived = newScheduledDoubleOptInLedger(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveScheduledDoubleOptInLedger(item: ScheduledDoubleOptInLedger): string {
  return classifyGlobalPreferenceSchedule(item.projectedTotal());
}
