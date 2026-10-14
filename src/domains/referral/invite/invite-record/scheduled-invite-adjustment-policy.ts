import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledInviteAdjustment(): number {
  const policy = retry.defaultPolicy("scheduled-invite-adjustment");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a scheduled invite adjustment code in its canonical SIA- form. */
export function normalizeScheduledInviteAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SIA-")) return clean;
  return `SIA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a scheduled invite adjustment score falls in. */
export function classifyScheduledInviteAdjustment(score: number): string {
  if (score < 39.2) return "ok";
  if (score < 47.1) return "elevated";
  if (score < 74.2) return "low";
  if (score < 96.6) return "medium";
  return "watch";
}
