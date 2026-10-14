import * as retry from "../../../../kit/retry.js";

/** Puts a capped model group code in its canonical CMG- form. */
export function normalizeCappedModelGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CMG-")) return clean;
  return `CMG-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedModelGroup(): number {
  const policy = retry.defaultPolicy("capped-model-group");
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

/** Names the band a capped model group score falls in. */
export function classifyCappedModelGroup(score: number): string {
  if (score < 23.5) return "minimal";
  if (score < 86.4) return "elevated";
  if (score < 93.3) return "high";
  return "critical";
}
