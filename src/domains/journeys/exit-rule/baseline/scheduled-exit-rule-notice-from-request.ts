import { classifyManualJourneySlot } from "../../journey/slot/manual-journey-slot-policy.js";
import { SeasonalJourneyRequest } from "../../journey/slot/seasonal-journey-request.js";
import { ScheduledExitRuleNotice, newScheduledExitRuleNotice } from "./scheduled-exit-rule-notice.js";

export function summarizeSeasonalJourneyRequestsForNotice(items: SeasonalJourneyRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveScheduledExitRuleNoticesFromRequest(items: SeasonalJourneyRequest[]): ScheduledExitRuleNotice[] {
  const out: ScheduledExitRuleNotice[] = [];
  for (const item of items) {
    const derived = newScheduledExitRuleNotice(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignScheduledExitRuleNotice(item: ScheduledExitRuleNotice): string {
  return classifyManualJourneySlot(item.measuredValue());
}
