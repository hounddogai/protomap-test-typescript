import * as retry from "../../../../kit/retry.js";

/** Puts a ticket view target code in its canonical TVT- form. */
export function normalizeTicketViewTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVT-")) return clean;
  return `TVT-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTicketViewTarget(): number {
  const policy = retry.defaultPolicy("ticket-view-target");
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

/** Names the band a ticket view target score falls in. */
export function classifyTicketViewTarget(score: number): string {
  if (score < 5.5) return "medium";
  if (score < 80.1) return "critical";
  if (score < 90.9) return "ok";
  return "watch";
}
