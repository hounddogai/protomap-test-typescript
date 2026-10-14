import { MacroManifest } from "../override-item/macro-manifest.js";
import { normalizeMacroOverrideCode } from "../override-item/macro-override-policy.js";
import { MacroForecast, newMacroForecast } from "./macro-forecast.js";

export function summarizeMacroManifestsForForecast(items: MacroManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveMacroForecastsFromManifest(items: MacroManifest[]): MacroForecast[] {
  const out: MacroForecast[] = [];
  for (const item of items) {
    const derived = newMacroForecast(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateMacroForecast(item: MacroForecast): string {
  return normalizeMacroOverrideCode(item.code);
}
