import { InviteSegment } from "../segment/invite-segment.js";
import { inviteThresholdBucket } from "../segment/invite-threshold-policy.js";
import { InviteBaseline, newInviteBaseline } from "./invite-baseline.js";

export function summarizeInviteSegmentsForBaseline(items: InviteSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveInviteBaselinesFromSegment(items: InviteSegment[]): InviteBaseline[] {
  const out: InviteBaseline[] = [];
  for (const item of items) {
    const derived = newInviteBaseline(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateInviteBaseline(item: InviteBaseline): string {
  return inviteThresholdBucket(item.adjustedVolume());
}
