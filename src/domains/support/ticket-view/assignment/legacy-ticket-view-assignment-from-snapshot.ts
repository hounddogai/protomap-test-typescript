import { deflectionPreferenceBucket } from "../../deflection/deflection-snapshot/deflection-preference-policy.js";
import { LenientDeflectionSnapshot } from "../../deflection/deflection-snapshot/lenient-deflection-snapshot.js";
import { LegacyTicketViewAssignment, newLegacyTicketViewAssignment } from "./legacy-ticket-view-assignment.js";

export function summarizeLenientDeflectionSnapshotsForAssignment(items: LenientDeflectionSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveLegacyTicketViewAssignmentsFromSnapshot(items: LenientDeflectionSnapshot[]): LegacyTicketViewAssignment[] {
  const out: LegacyTicketViewAssignment[] = [];
  for (const item of items) {
    const derived = newLegacyTicketViewAssignment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectLegacyTicketViewAssignment(item: LegacyTicketViewAssignment): string {
  return deflectionPreferenceBucket(item.projectedValue());
}
