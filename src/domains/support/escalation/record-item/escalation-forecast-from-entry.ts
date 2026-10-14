import { RollingMacroEntry } from "../../macro/slot/rolling-macro-entry.js";
import { normalizeSeasonalMacroRequestCode } from "../../macro/slot/seasonal-macro-request-policy.js";
import { EscalationForecast, newEscalationForecast } from "./escalation-forecast.js";

export function summarizeRollingMacroEntriesForForecast(items: RollingMacroEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveEscalationForecastsFromEntry(items: RollingMacroEntry[]): EscalationForecast[] {
  const out: EscalationForecast[] = [];
  for (const item of items) {
    const derived = newEscalationForecast(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeEscalationForecast(item: EscalationForecast): string {
  return normalizeSeasonalMacroRequestCode(item.code);
}
