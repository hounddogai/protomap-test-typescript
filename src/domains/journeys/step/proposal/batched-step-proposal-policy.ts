import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function batchedStepProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedStepProposal(): number {
  const policy = retry.defaultPolicy("batched-step-proposal");
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

/** Names the band a batched step proposal score falls in. */
export function classifyBatchedStepProposal(score: number): string {
  if (score < 15.9) return "ok";
  if (score < 31.8) return "elevated";
  if (score < 35.3) return "minimal";
  if (score < 96.2) return "watch";
  return "high";
}

export function batchedStepProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
