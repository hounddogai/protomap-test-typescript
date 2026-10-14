import { fallbackInsightGroupBucket } from "../../insight/group/fallback-insight-group-policy.js";
import { RegionalInsightReservation } from "../../insight/group/regional-insight-reservation.js";
import { FallbackReplyScore, newFallbackReplyScore } from "./fallback-reply-score.js";

export function summarizeRegionalInsightReservationsForScore(items: RegionalInsightReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveFallbackReplyScoresFromReservation(items: RegionalInsightReservation[]): FallbackReplyScore[] {
  const out: FallbackReplyScore[] = [];
  for (const item of items) {
    const derived = newFallbackReplyScore(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitFallbackReplyScore(item: FallbackReplyScore): string {
  return fallbackInsightGroupBucket(item.adjustedExposure());
}
