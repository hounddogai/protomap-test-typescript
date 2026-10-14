import { legacyWaitExceptionWeight } from "../../wait/wait-exception/legacy-wait-exception-policy.js";
import { LenientWaitPolicy } from "../../wait/wait-exception/lenient-wait-policy.js";
import { JourneyEntry, newJourneyEntry } from "./journey-entry.js";

export function summarizeLenientWaitPoliciesForEntry(items: LenientWaitPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveJourneyEntriesFromPolicy(items: LenientWaitPolicy[]): JourneyEntry[] {
  const out: JourneyEntry[] = [];
  for (const item of items) {
    const derived = newJourneyEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeJourneyEntry(item: JourneyEntry): number {
  return legacyWaitExceptionWeight(8, true);
}
