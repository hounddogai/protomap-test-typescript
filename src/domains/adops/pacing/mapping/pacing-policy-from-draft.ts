import { flightDraftBucket } from "../../flight/template/flight-draft-policy.js";
import { FlightDraft } from "../../flight/template/flight-draft.js";
import { PacingPolicy, newPacingPolicy } from "./pacing-policy.js";

export function summarizeFlightDraftsForPolicy(items: FlightDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function derivePacingPoliciesFromDraft(items: FlightDraft[]): PacingPolicy[] {
  const out: PacingPolicy[] = [];
  for (const item of items) {
    const derived = newPacingPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitPacingPolicy(item: PacingPolicy): string {
  return flightDraftBucket(item.adjustedValue());
}
