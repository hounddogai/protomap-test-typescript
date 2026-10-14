import * as numbers from "../../../../kit/numbers.js";
import { BatchedReplyClaim } from "./batched-reply-claim.js";

/** One step of the batched reply claim calculation. */
export interface BatchedReplyClaimFactor {
  describe(): string;
  adjust(item: BatchedReplyClaim, value: number): number;
}

export class PercentBatchedReplyClaimAdjuster implements BatchedReplyClaimFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedReplyClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedReplyClaimAdjuster implements BatchedReplyClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedReplyClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class BatchedReplyClaimRetriesOffsetAdjuster implements BatchedReplyClaimFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: BatchedReplyClaim, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class RoundingBatchedReplyClaimAdjuster implements BatchedReplyClaimFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedReplyClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched reply claim steps in order and keeps a trace of each. */
export class BatchedReplyClaimEngine {
  steps: BatchedReplyClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedReplyClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedReplyClaim): number {
    let current = item.effectiveVolume();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: BatchedReplyClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedReplyClaimEngine(): BatchedReplyClaimEngine {
  return new BatchedReplyClaimEngine(
    [
      new PercentBatchedReplyClaimAdjuster(14.4),
      new CapBatchedReplyClaimAdjuster(4289),
      new BatchedReplyClaimRetriesOffsetAdjuster(1.89),
      new RoundingBatchedReplyClaimAdjuster(1),
    ],
    [],
    2.8,
    55938.9,
  );
}
