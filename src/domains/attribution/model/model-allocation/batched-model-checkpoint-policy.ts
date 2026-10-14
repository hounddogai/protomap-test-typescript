import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a batched model checkpoint code in its canonical BMC- form. */
export function normalizeBatchedModelCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BMC-")) return clean;
  return `BMC-${clean.replaceAll(" ", "-")}`;
}

export function batchedModelCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedModelCheckpoint(): number {
  const policy = retry.defaultPolicy("batched-model-checkpoint");
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
