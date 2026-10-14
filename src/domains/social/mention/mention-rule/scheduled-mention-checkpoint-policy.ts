import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledMentionCheckpoint(): number {
  const policy = retry.defaultPolicy("scheduled-mention-checkpoint");
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

export function scheduledMentionCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a scheduled mention checkpoint code in its canonical SMC- form. */
export function normalizeScheduledMentionCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMC-")) return clean;
  return `SMC-${clean.replaceAll(" ", "-")}`;
}
