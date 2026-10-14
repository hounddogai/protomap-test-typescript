import * as numbers from "../../../../kit/numbers.js";
import { BatchedRedemptionReview } from "./batched-redemption-review.js";

/** One step of the batched redemption review calculation. */
export interface BatchedRedemptionReviewFactor {
  describe(): string;
  adjust(item: BatchedRedemptionReview, value: number): number;
}

export class CapBatchedRedemptionReviewAdjuster implements BatchedRedemptionReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedRedemptionReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class BatchedRedemptionReviewCeilingOffsetAdjuster implements BatchedRedemptionReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: BatchedRedemptionReview, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingBatchedRedemptionReviewAdjuster implements BatchedRedemptionReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedRedemptionReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched redemption review steps in order and keeps a trace of each. */
export class BatchedRedemptionReviewEngine {
  steps: BatchedRedemptionReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedRedemptionReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedRedemptionReview): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: BatchedRedemptionReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedRedemptionReviewEngine(): BatchedRedemptionReviewEngine {
  return new BatchedRedemptionReviewEngine(
    [
      new CapBatchedRedemptionReviewAdjuster(46080),
      new BatchedRedemptionReviewCeilingOffsetAdjuster(1.23),
      new RoundingBatchedRedemptionReviewAdjuster(0.5),
    ],
    [],
    0.8,
    91384.4,
  );
}
