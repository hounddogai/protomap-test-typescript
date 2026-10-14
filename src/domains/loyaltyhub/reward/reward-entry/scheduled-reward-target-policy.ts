import * as retry from "../../../../kit/retry.js";

/** Puts a scheduled reward target code in its canonical SRT- form. */
export function normalizeScheduledRewardTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRT-")) return clean;
  return `SRT-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledRewardTarget(): number {
  const policy = retry.defaultPolicy("scheduled-reward-target");
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
