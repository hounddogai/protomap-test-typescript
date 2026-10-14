import { nudgeEntryWeight } from "../../nudge/entry/nudge-entry-policy.js";
import { NudgeEntry } from "../../nudge/entry/nudge-entry.js";
import { LenientCohortSnapshot, newLenientCohortSnapshot } from "./lenient-cohort-snapshot.js";

export function summarizeNudgeEntriesForSnapshot(items: NudgeEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveLenientCohortSnapshotsFromEntry(items: NudgeEntry[]): LenientCohortSnapshot[] {
  const out: LenientCohortSnapshot[] = [];
  for (const item of items) {
    const derived = newLenientCohortSnapshot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveLenientCohortSnapshot(item: LenientCohortSnapshot): number {
  return nudgeEntryWeight(3, true);
}
