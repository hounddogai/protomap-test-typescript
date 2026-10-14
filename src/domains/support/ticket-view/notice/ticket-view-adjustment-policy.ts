import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTicketViewAdjustment(): number {
  const policy = retry.defaultPolicy("ticket-view-adjustment");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a ticket view adjustment code in its canonical TVA- form. */
export function normalizeTicketViewAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVA-")) return clean;
  return `TVA-${clean.replaceAll(" ", "-")}`;
}
