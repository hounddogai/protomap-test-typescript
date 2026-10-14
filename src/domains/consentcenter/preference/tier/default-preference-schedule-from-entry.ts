import { proofEntryBucket } from "../../proof/proposal/proof-entry-policy.js";
import { ProofEntry } from "../../proof/proposal/proof-entry.js";
import { DefaultPreferenceSchedule, newDefaultPreferenceSchedule } from "./default-preference-schedule.js";

export function summarizeProofEntriesForSchedule(items: ProofEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveDefaultPreferenceSchedulesFromEntry(items: ProofEntry[]): DefaultPreferenceSchedule[] {
  const out: DefaultPreferenceSchedule[] = [];
  for (const item of items) {
    const derived = newDefaultPreferenceSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceDefaultPreferenceSchedule(item: DefaultPreferenceSchedule): string {
  return proofEntryBucket(item.netTotal());
}
