import * as numbers from "../../../../kit/numbers.js";
import { BatchedCreativeReview } from "./batched-creative-review.js";

/** One step of the batched creative review calculation. */
export interface BatchedCreativeReviewFactor {
  describe(): string;
  adjust(item: BatchedCreativeReview, value: number): number;
}

export class RoundingBatchedCreativeReviewAdjuster implements BatchedCreativeReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedCreativeReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBatchedCreativeReviewAdjuster implements BatchedCreativeReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedCreativeReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleBatchedCreativeReviewAdjuster implements BatchedCreativeReviewFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedCreativeReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched creative review steps in order and keeps a trace of each. */
export class BatchedCreativeReviewEngine {
  steps: BatchedCreativeReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedCreativeReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedCreativeReview): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: BatchedCreativeReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedCreativeReviewEngine(): BatchedCreativeReviewEngine {
  return new BatchedCreativeReviewEngine(
    [
      new RoundingBatchedCreativeReviewAdjuster(0.5),
      new TieredBatchedCreativeReviewAdjuster([5930, 6208, 8636], [0.83, 1.13, 1.15]),
      new TitleBatchedCreativeReviewAdjuster(new Map<string, number>([["central", 0.89], ["retail", 1.36]])),
    ],
    [],
    0.7,
    92699.7,
  );
}
