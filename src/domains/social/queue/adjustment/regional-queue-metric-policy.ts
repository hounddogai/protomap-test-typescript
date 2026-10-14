import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalQueueMetric(): number {
  const policy = retry.defaultPolicy("regional-queue-metric");
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

/** Puts a regional queue metric code in its canonical RQM- form. */
export function normalizeRegionalQueueMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RQM-")) return clean;
  return `RQM-${clean.replaceAll(" ", "-")}`;
}
