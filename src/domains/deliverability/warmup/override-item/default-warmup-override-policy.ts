import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function defaultWarmupOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a default warmup override code in its canonical DWO- form. */
export function normalizeDefaultWarmupOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DWO-")) return clean;
  return `DWO-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultWarmupOverride(): number {
  const policy = retry.defaultPolicy("default-warmup-override");
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

export function defaultWarmupOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.81;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
