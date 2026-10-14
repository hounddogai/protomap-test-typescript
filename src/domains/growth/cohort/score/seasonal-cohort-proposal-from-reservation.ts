import { globalNudgeForecastBucket } from "../../nudge/nudge-forecast/global-nudge-forecast-policy.js";
import { NudgeReservation } from "../../nudge/nudge-forecast/nudge-reservation.js";
import { SeasonalCohortProposal, newSeasonalCohortProposal } from "./seasonal-cohort-proposal.js";

export function summarizeNudgeReservationsForProposal(items: NudgeReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalCohortProposalsFromReservation(items: NudgeReservation[]): SeasonalCohortProposal[] {
  const out: SeasonalCohortProposal[] = [];
  for (const item of items) {
    const derived = newSeasonalCohortProposal(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignSeasonalCohortProposal(item: SeasonalCohortProposal): string {
  return globalNudgeForecastBucket(item.effectiveValue());
}
