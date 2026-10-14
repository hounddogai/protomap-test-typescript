import * as numbers from "../../../../kit/numbers.js";
import { StreakReview } from "./streak-review.js";

/** One step of the streak review calculation. */
export interface StreakReviewFactor {
  describe(): string;
  adjust(item: StreakReview, value: number): number;
}

export class PercentStreakReviewAdjuster implements StreakReviewFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredStreakReviewAdjuster implements StreakReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class StreakReviewUpdatedAtOffsetAdjuster implements StreakReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: StreakReview, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class RoundingStreakReviewAdjuster implements StreakReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StreakReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelStreakReviewAdjuster implements StreakReviewFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StreakReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStreakReviewAdjuster implements StreakReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the streak review steps in order and keeps a trace of each. */
export class StreakReviewEngine {
  steps: StreakReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StreakReview): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: StreakReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStreakReviewEngine(): StreakReviewEngine {
  return new StreakReviewEngine(
    [
      new PercentStreakReviewAdjuster(1.5),
      new TieredStreakReviewAdjuster([2283, 8171], [0.99, 0.81]),
      new StreakReviewUpdatedAtOffsetAdjuster(0.63),
      new RoundingStreakReviewAdjuster(0.25),
      new ChannelStreakReviewAdjuster(
        new Map<string, number>([["online", 1.29], ["west", 1.31], ["south", 1.36]]),
      ),
      new MinimumStreakReviewAdjuster(15.9),
    ],
    [],
    2.5,
    38349.4,
  );
}
