import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePlacementEstimate(): number {
  const policy = retry.defaultPolicy("placement-estimate");
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

/** Puts a placement estimate code in its canonical PE- form. */
export function normalizePlacementEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PE-")) return clean;
  return `PE-${clean.replaceAll(" ", "-")}`;
}
