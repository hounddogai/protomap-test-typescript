import * as retry from "../../../../kit/retry.js";

/** Names the band a legacy ticket view slot score falls in. */
export function classifyLegacyTicketViewSlot(score: number): string {
  if (score < 18.4) return "watch";
  if (score < 25) return "ok";
  if (score < 64.7) return "high";
  if (score < 74.3) return "low";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyTicketViewSlot(): number {
  const policy = retry.defaultPolicy("legacy-ticket-view-slot");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function legacyTicketViewSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
