import { journeyScheduleWeight } from "../../journey/template/journey-schedule-policy.js";
import { JourneySlot } from "../../journey/template/journey-slot.js";
import { RollingStepEntry, newRollingStepEntry } from "./rolling-step-entry.js";

export function summarizeJourneySlotsForEntry(items: JourneySlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingStepEntriesFromSlot(items: JourneySlot[]): RollingStepEntry[] {
  const out: RollingStepEntry[] = [];
  for (const item of items) {
    const derived = newRollingStepEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRollingStepEntry(item: RollingStepEntry): number {
  return journeyScheduleWeight(5, true);
}
