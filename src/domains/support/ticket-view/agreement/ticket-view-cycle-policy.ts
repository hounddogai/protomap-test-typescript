import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTicketViewCycle(): number {
  const policy = retry.defaultPolicy("ticket-view-cycle");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a ticket view cycle code in its canonical TVC- form. */
export function normalizeTicketViewCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVC-")) return clean;
  return `TVC-${clean.replaceAll(" ", "-")}`;
}
