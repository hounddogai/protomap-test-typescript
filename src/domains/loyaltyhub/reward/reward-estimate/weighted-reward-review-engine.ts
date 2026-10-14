import { WeightedRewardReview } from "./weighted-reward-review.js";

/** One step of the weighted reward review calculation. */
export interface WeightedRewardReviewFactor {
  describe(): string;
  adjust(item: WeightedRewardReview, value: number): number;
}

export class WeightedRewardReviewMinimumOffsetAdjuster implements WeightedRewardReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: WeightedRewardReview, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class MinimumWeightedRewardReviewAdjuster implements WeightedRewardReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedRewardReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredWeightedRewardReviewAdjuster implements WeightedRewardReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedRewardReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted reward review steps in order and keeps a trace of each. */
export class WeightedRewardReviewEngine {
  steps: WeightedRewardReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedRewardReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedRewardReview): number {
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

  evaluateAll(items: WeightedRewardReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedRewardReviewEngine(): WeightedRewardReviewEngine {
  return new WeightedRewardReviewEngine(
    [
      new WeightedRewardReviewMinimumOffsetAdjuster(0.28),
      new MinimumWeightedRewardReviewAdjuster(44.7),
      new TieredWeightedRewardReviewAdjuster([696, 2837, 6315], [0.95, 1.16, 1.11]),
    ],
    [],
    1.9,
    58097,
  );
}
