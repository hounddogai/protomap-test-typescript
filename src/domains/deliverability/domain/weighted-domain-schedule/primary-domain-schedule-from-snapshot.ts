import { classifyLegacySenderSnapshot } from "../../sender/sender-snapshot/legacy-sender-snapshot-policy.js";
import { LegacySenderSnapshot } from "../../sender/sender-snapshot/legacy-sender-snapshot.js";
import { PrimaryDomainSchedule, newPrimaryDomainSchedule } from "./primary-domain-schedule.js";

export function summarizeLegacySenderSnapshotsForSchedule(items: LegacySenderSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function derivePrimaryDomainSchedulesFromSnapshot(items: LegacySenderSnapshot[]): PrimaryDomainSchedule[] {
  const out: PrimaryDomainSchedule[] = [];
  for (const item of items) {
    const derived = newPrimaryDomainSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePrimaryDomainSchedule(item: PrimaryDomainSchedule): string {
  return classifyLegacySenderSnapshot(item.weightedTotal());
}
