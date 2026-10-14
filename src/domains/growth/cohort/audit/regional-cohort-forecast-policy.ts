import * as retry from "../../../../kit/retry.js";

/** Puts a regional cohort forecast code in its canonical RCF- form. */
export function normalizeRegionalCohortForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCF-")) return clean;
  return `RCF-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalCohortForecast(): number {
  const policy = retry.defaultPolicy("regional-cohort-forecast");
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
