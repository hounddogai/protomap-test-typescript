import * as numbers from "../../../../kit/numbers.js";
import { BatchedDeflectionReview } from "./batched-deflection-review.js";

/** One step of the batched deflection review calculation. */
export interface BatchedDeflectionReviewAdjuster {
  describe(): string;
  adjust(item: BatchedDeflectionReview, value: number): number;
}

export class RoundingBatchedDeflectionReviewAdjuster implements BatchedDeflectionReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedDeflectionReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBatchedDeflectionReviewAdjuster implements BatchedDeflectionReviewAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedDeflectionReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapBatchedDeflectionReviewAdjuster implements BatchedDeflectionReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedDeflectionReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched deflection review steps in order and keeps a trace of each. */
export class BatchedDeflectionReviewEngine {
  steps: BatchedDeflectionReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedDeflectionReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedDeflectionReview): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: BatchedDeflectionReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedDeflectionReviewEngine(): BatchedDeflectionReviewEngine {
  return new BatchedDeflectionReviewEngine(
    [
      new RoundingBatchedDeflectionReviewAdjuster(5),
      new TieredBatchedDeflectionReviewAdjuster([1177, 1774, 4880, 9649], [1.18, 1.16, 1, 0.99]),
      new CapBatchedDeflectionReviewAdjuster(43973),
    ],
    [],
    0.2,
    75984.5,
  );
}
