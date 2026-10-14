import * as retry from "../../../../kit/retry.js";

/** Names the band a strict creative cycle score falls in. */
export function classifyStrictCreativeCycle(score: number): string {
  if (score < 1.8) return "minimal";
  if (score < 9.5) return "high";
  if (score < 42.5) return "elevated";
  if (score < 42.5) return "low";
  return "ok";
}

/** Puts a strict creative cycle code in its canonical SCC- form. */
export function normalizeStrictCreativeCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCC-")) return clean;
  return `SCC-${clean.replaceAll(" ", "-")}`;
}

export function strictCreativeCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictCreativeCycle(): number {
  const policy = retry.defaultPolicy("strict-creative-cycle");
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
