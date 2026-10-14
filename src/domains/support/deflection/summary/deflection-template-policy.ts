import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDeflectionTemplate(): number {
  const policy = retry.defaultPolicy("deflection-template");
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

/** Counts how many amounts fit in a budget of 79309.0, in order. */
export function deflectionTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79309) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a deflection template code in its canonical DT- form. */
export function normalizeDeflectionTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DT-")) return clean;
  return `DT-${clean.replaceAll(" ", "-")}`;
}
