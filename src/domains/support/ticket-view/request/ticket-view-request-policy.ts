import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTicketViewRequest(): number {
  const policy = retry.defaultPolicy("ticket-view-request");
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

/** Names the band a ticket view request score falls in. */
export function classifyTicketViewRequest(score: number): string {
  if (score < 25.2) return "critical";
  if (score < 85.4) return "low";
  return "high";
}

/** Puts a ticket view request code in its canonical TVR- form. */
export function normalizeTicketViewRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVR-")) return clean;
  return `TVR-${clean.replaceAll(" ", "-")}`;
}
