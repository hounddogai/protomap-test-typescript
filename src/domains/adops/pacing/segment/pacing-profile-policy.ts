import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePacingProfile(): number {
  const policy = retry.defaultPolicy("pacing-profile");
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

export function pacingProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.51;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a pacing profile code in its canonical PP- form. */
export function normalizePacingProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}
