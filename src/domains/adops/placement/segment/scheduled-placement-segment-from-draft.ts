import { FlightDraft } from "../../flight/template/flight-draft.js";
import { classifyFlightTemplate } from "../../flight/template/flight-template-policy.js";
import { ScheduledPlacementSegment, newScheduledPlacementSegment } from "./scheduled-placement-segment.js";

export function summarizeFlightDraftsForSegment(items: FlightDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveScheduledPlacementSegmentsFromDraft(items: FlightDraft[]): ScheduledPlacementSegment[] {
  const out: ScheduledPlacementSegment[] = [];
  for (const item of items) {
    const derived = newScheduledPlacementSegment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeScheduledPlacementSegment(item: ScheduledPlacementSegment): string {
  return classifyFlightTemplate(item.adjustedValue());
}
