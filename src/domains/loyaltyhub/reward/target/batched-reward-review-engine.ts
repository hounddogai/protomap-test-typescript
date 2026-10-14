import * as numbers from "../../../../kit/numbers.js";
import { BatchedRewardReview } from "./batched-reward-review.js";

/** One step of the batched reward review calculation. */
export interface BatchedRewardReviewModifier {
  describe(): string;
  adjust(item: BatchedRewardReview, value: number): number;
}

export class LocaleBatchedRewardReviewAdjuster implements BatchedRewardReviewModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BatchedRewardReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBatchedRewardReviewAdjuster implements BatchedRewardReviewModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedRewardReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapBatchedRewardReviewAdjuster implements BatchedRewardReviewModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedRewardReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class BatchedRewardReviewRetriesOffsetAdjuster implements BatchedRewardReviewModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: BatchedRewardReview, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class RoundingBatchedRewardReviewAdjuster implements BatchedRewardReviewModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedRewardReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBatchedRewardReviewAdjuster implements BatchedRewardReviewModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedRewardReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the batched reward review steps in order and keeps a trace of each. */
export class BatchedRewardReviewEngine {
  steps: BatchedRewardReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedRewardReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedRewardReview): number {
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

  evaluateAll(items: BatchedRewardReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedRewardReviewEngine(): BatchedRewardReviewEngine {
  return new BatchedRewardReviewEngine(
    [
      new LocaleBatchedRewardReviewAdjuster(new Map<string, number>([["central", 0.9], ["west", 0.75]])),
      new TieredBatchedRewardReviewAdjuster([5984, 7816, 9129], [0.89, 0.86, 0.97]),
      new CapBatchedRewardReviewAdjuster(40429),
      new BatchedRewardReviewRetriesOffsetAdjuster(1.1),
      new RoundingBatchedRewardReviewAdjuster(0.5),
      new MinimumBatchedRewardReviewAdjuster(46.1),
    ],
    [],
    2.9,
    70348.9,
  );
}
