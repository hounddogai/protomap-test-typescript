import { EnrollmentDraft } from "../../enrollment/reservation/enrollment-draft.js";
import { classifyRollingEnrollmentWindow } from "../../enrollment/reservation/rolling-enrollment-window-policy.js";
import { JourneyWindow, newJourneyWindow } from "./journey-window.js";

export function summarizeEnrollmentDraftsForWindow(items: EnrollmentDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveJourneyWindowsFromDraft(items: EnrollmentDraft[]): JourneyWindow[] {
  const out: JourneyWindow[] = [];
  for (const item of items) {
    const derived = newJourneyWindow(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignJourneyWindow(item: JourneyWindow): string {
  return classifyRollingEnrollmentWindow(item.effectiveVolume());
}
