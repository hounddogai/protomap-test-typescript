import * as numbers from "../../../../kit/numbers.js";
import { BatchedDoubleOptInReview } from "./batched-double-opt-in-review.js";

/** One step of the batched double opt in review calculation. */
export interface BatchedDoubleOptInReviewAdjuster {
  describe(): string;
  adjust(item: BatchedDoubleOptInReview, value: number): number;
}

export class RoundingBatchedDoubleOptInReviewAdjuster implements BatchedDoubleOptInReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedDoubleOptInReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBatchedDoubleOptInReviewAdjuster implements BatchedDoubleOptInReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedDoubleOptInReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBatchedDoubleOptInReviewAdjuster implements BatchedDoubleOptInReviewAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedDoubleOptInReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched double opt in review steps in order and keeps a trace of each. */
export class BatchedDoubleOptInReviewEngine {
  steps: BatchedDoubleOptInReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedDoubleOptInReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedDoubleOptInReview): number {
    let current = item.effectiveExposure();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: BatchedDoubleOptInReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedDoubleOptInReviewEngine(): BatchedDoubleOptInReviewEngine {
  return new BatchedDoubleOptInReviewEngine(
    [
      new RoundingBatchedDoubleOptInReviewAdjuster(5),
      new CapBatchedDoubleOptInReviewAdjuster(15653),
      new TieredBatchedDoubleOptInReviewAdjuster([606, 2340, 5573], [0.87, 0.89, 1.2]),
    ],
    [],
    2.3,
    93377.2,
  );
}
