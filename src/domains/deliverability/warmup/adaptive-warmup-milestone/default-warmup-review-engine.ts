import * as numbers from "../../../../kit/numbers.js";
import { DefaultWarmupReview } from "./default-warmup-review.js";

/** One step of the default warmup review calculation. */
export interface DefaultWarmupReviewFactor {
  describe(): string;
  adjust(item: DefaultWarmupReview, value: number): number;
}

export class MinimumDefaultWarmupReviewAdjuster implements DefaultWarmupReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultWarmupReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentDefaultWarmupReviewAdjuster implements DefaultWarmupReviewFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultWarmupReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultWarmupReviewAdjuster implements DefaultWarmupReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultWarmupReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default warmup review steps in order and keeps a trace of each. */
export class DefaultWarmupReviewEngine {
  steps: DefaultWarmupReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultWarmupReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultWarmupReview): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: DefaultWarmupReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultWarmupReviewEngine(): DefaultWarmupReviewEngine {
  return new DefaultWarmupReviewEngine(
    [
      new MinimumDefaultWarmupReviewAdjuster(0.6),
      new PercentDefaultWarmupReviewAdjuster(-4),
      new TieredDefaultWarmupReviewAdjuster([2554, 3273, 7676], [0.86, 0.88, 1]),
    ],
    [],
    2,
    81938.5,
  );
}
