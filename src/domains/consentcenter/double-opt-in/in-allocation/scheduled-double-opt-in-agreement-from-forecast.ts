import { OptOutForecast } from "../../opt-out/forecast/opt-out-forecast.js";
import { normalizeTieredOptOutWindowCode } from "../../opt-out/forecast/tiered-opt-out-window-policy.js";
import {
  ScheduledDoubleOptInAgreement,
  newScheduledDoubleOptInAgreement,
} from "./scheduled-double-opt-in-agreement.js";

export function summarizeOptOutForecastsForAgreement(items: OptOutForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveScheduledDoubleOptInAgreementsFromForecast(items: OptOutForecast[]): ScheduledDoubleOptInAgreement[] {
  const out: ScheduledDoubleOptInAgreement[] = [];
  for (const item of items) {
    const derived = newScheduledDoubleOptInAgreement(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateScheduledDoubleOptInAgreement(item: ScheduledDoubleOptInAgreement): string {
  return normalizeTieredOptOutWindowCode(item.code);
}
