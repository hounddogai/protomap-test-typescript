import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function ticketViewExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a ticket view exception score falls in. */
export function classifyTicketViewException(score: number): string {
  if (score < 15.4) return "high";
  if (score < 41.1) return "critical";
  if (score < 42.2) return "minimal";
  if (score < 57.4) return "elevated";
  return "low";
}

/** Puts a ticket view exception code in its canonical TVE- form. */
export function normalizeTicketViewExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVE-")) return clean;
  return `TVE-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTicketViewException(): number {
  const policy = retry.defaultPolicy("ticket-view-exception");
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
