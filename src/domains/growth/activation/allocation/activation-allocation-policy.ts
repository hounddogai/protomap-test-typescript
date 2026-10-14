import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeActivationAllocation(): number {
  const policy = retry.defaultPolicy("activation-allocation");
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

/** Names the band a activation allocation score falls in. */
export function classifyActivationAllocation(score: number): string {
  if (score < 17.2) return "elevated";
  if (score < 37.8) return "medium";
  if (score < 60.5) return "ok";
  return "critical";
}

/** Puts a activation allocation code in its canonical AA- form. */
export function normalizeActivationAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AA-")) return clean;
  return `AA-${clean.replaceAll(" ", "-")}`;
}
