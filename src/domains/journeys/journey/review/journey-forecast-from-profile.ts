import { enrollmentProfileWeight } from "../../enrollment/profile/enrollment-profile-policy.js";
import { EnrollmentProfile } from "../../enrollment/profile/enrollment-profile.js";
import { JourneyForecast, newJourneyForecast } from "./journey-forecast.js";

export function summarizeEnrollmentProfilesForForecast(items: EnrollmentProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveJourneyForecastsFromProfile(items: EnrollmentProfile[]): JourneyForecast[] {
  const out: JourneyForecast[] = [];
  for (const item of items) {
    const derived = newJourneyForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planJourneyForecast(item: JourneyForecast): number {
  return enrollmentProfileWeight(7, true);
}
