import { BatchedSuppressionReview } from "./batched-suppression-review.js";

/** One step of the batched suppression review calculation. */
export interface BatchedSuppressionReviewAdjuster {
  describe(): string;
  adjust(item: BatchedSuppressionReview, value: number): number;
}

export class CapBatchedSuppressionReviewAdjuster implements BatchedSuppressionReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedSuppressionReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBatchedSuppressionReviewAdjuster implements BatchedSuppressionReviewAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedSuppressionReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedSuppressionReviewAdjuster implements BatchedSuppressionReviewAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedSuppressionReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched suppression review steps in order and keeps a trace of each. */
export class BatchedSuppressionReviewEngine {
  steps: BatchedSuppressionReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedSuppressionReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedSuppressionReview): number {
    let current = item.projectedValue();
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

  evaluateAll(items: BatchedSuppressionReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedSuppressionReviewEngine(): BatchedSuppressionReviewEngine {
  return new BatchedSuppressionReviewEngine(
    [
      new CapBatchedSuppressionReviewAdjuster(2064),
      new MinimumBatchedSuppressionReviewAdjuster(40.6),
      new PercentBatchedSuppressionReviewAdjuster(-5.5),
    ],
    [],
    0.9,
    40680,
  );
}
