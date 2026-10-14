import { StrictActivationException } from "../../activation/exception/strict-activation-exception.js";
import { tieredActivationRecordWeight } from "../../activation/exception/tiered-activation-record-policy.js";
import { CappedNudgeEntry, newCappedNudgeEntry } from "./capped-nudge-entry.js";

export function summarizeStrictActivationExceptionsForEntry(items: StrictActivationException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveCappedNudgeEntriesFromException(items: StrictActivationException[]): CappedNudgeEntry[] {
  const out: CappedNudgeEntry[] = [];
  for (const item of items) {
    const derived = newCappedNudgeEntry(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitCappedNudgeEntry(item: CappedNudgeEntry): number {
  return tieredActivationRecordWeight(7, true);
}
