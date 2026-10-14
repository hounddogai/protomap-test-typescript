import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedPreferenceForecast(): number {
  const policy = retry.defaultPolicy("batched-preference-forecast");
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

/** Puts a batched preference forecast code in its canonical BPF- form. */
export function normalizeBatchedPreferenceForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BPF-")) return clean;
  return `BPF-${clean.replaceAll(" ", "-")}`;
}
