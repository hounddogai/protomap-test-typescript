import { DefaultSubscriptionCycle } from "../../subscription/subscription-slot/default-subscription-cycle.js";
import {
  classifyLegacySubscriptionSlot,
} from "../../subscription/subscription-slot/legacy-subscription-slot-policy.js";
import { StrictProofEntry, newStrictProofEntry } from "./strict-proof-entry.js";

export function summarizeDefaultSubscriptionCyclesForEntry(items: DefaultSubscriptionCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveStrictProofEntriesFromCycle(items: DefaultSubscriptionCycle[]): StrictProofEntry[] {
  const out: StrictProofEntry[] = [];
  for (const item of items) {
    const derived = newStrictProofEntry(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeStrictProofEntry(item: StrictProofEntry): string {
  return classifyLegacySubscriptionSlot(item.measuredValue());
}
