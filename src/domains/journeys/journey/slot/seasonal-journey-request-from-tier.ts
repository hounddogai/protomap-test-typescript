import { ScheduledEnrollmentTier } from "../../enrollment/threshold/scheduled-enrollment-tier.js";
import {
  classifySeasonalEnrollmentThreshold,
} from "../../enrollment/threshold/seasonal-enrollment-threshold-policy.js";
import { exitRuleScheduleBucket } from "../../exit-rule/schedule/exit-rule-schedule-policy.js";
import { ExitRuleTier } from "../../exit-rule/schedule/exit-rule-tier.js";
import { SeasonalJourneyRequest, newSeasonalJourneyRequest } from "./seasonal-journey-request.js";

export function summarizeExitRuleTiersForRequest(items: ExitRuleTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveSeasonalJourneyRequestsFromTier(items: ExitRuleTier[]): SeasonalJourneyRequest[] {
  const out: SeasonalJourneyRequest[] = [];
  for (const item of items) {
    const derived = newSeasonalJourneyRequest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveSeasonalJourneyRequest(item: SeasonalJourneyRequest): string {
  return exitRuleScheduleBucket(item.netExposure());
}

export function summarizeScheduledEnrollmentTiersForRequest(items: ScheduledEnrollmentTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveSeasonalJourneyRequestsFromTierExtra(items: ScheduledEnrollmentTier[]): SeasonalJourneyRequest[] {
  const out: SeasonalJourneyRequest[] = [];
  for (const item of items) {
    const derived = newSeasonalJourneyRequest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankSeasonalJourneyRequest(item: SeasonalJourneyRequest): string {
  return classifySeasonalEnrollmentThreshold(item.netExposure());
}
