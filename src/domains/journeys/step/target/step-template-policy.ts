import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStepTemplate(): number {
  const policy = retry.defaultPolicy("step-template");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a step template code in its canonical ST- form. */
export function normalizeStepTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ST-")) return clean;
  return `ST-${clean.replaceAll(" ", "-")}`;
}
