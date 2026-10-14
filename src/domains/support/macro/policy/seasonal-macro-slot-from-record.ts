import { CsatRecord } from "../../csat/proposal/csat-record.js";
import { normalizeLenientCsatReviewCode } from "../../csat/proposal/lenient-csat-review-policy.js";
import { SeasonalMacroSlot, newSeasonalMacroSlot } from "./seasonal-macro-slot.js";

export function summarizeCsatRecordsForSlot(items: CsatRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalMacroSlotsFromRecord(items: CsatRecord[]): SeasonalMacroSlot[] {
  const out: SeasonalMacroSlot[] = [];
  for (const item of items) {
    const derived = newSeasonalMacroSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeSeasonalMacroSlot(item: SeasonalMacroSlot): string {
  return normalizeLenientCsatReviewCode(item.code);
}
