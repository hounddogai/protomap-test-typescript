import {
  classifyLegacyDoubleOptInLedger,
} from "../../double-opt-in/batched-in-bundle/legacy-double-opt-in-ledger-policy.js";
import { LegacyDoubleOptInLedger } from "../../double-opt-in/batched-in-bundle/legacy-double-opt-in-ledger.js";
import { PreferenceItem, newPreferenceItem } from "./preference-item.js";

export function summarizeLegacyDoubleOptInLedgersForItem(items: LegacyDoubleOptInLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function derivePreferenceItemsFromLedger(items: LegacyDoubleOptInLedger[]): PreferenceItem[] {
  const out: PreferenceItem[] = [];
  for (const item of items) {
    const derived = newPreferenceItem(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizePreferenceItem(item: PreferenceItem): string {
  return classifyLegacyDoubleOptInLedger(item.netLoad());
}
