import * as retry from "../../../../kit/retry.js";

/** Puts a sender group code in its canonical SG- form. */
export function normalizeSenderGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SG-")) return clean;
  return `SG-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSenderGroup(): number {
  const policy = retry.defaultPolicy("sender-group");
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
