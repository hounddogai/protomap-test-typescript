import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeJourneyTarget(): number {
  const policy = retry.defaultPolicy("journey-target");
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

/** Names the band a journey target score falls in. */
export function classifyJourneyTarget(score: number): string {
  if (score < 2.5) return "ok";
  if (score < 70.9) return "high";
  if (score < 94.5) return "low";
  return "watch";
}
