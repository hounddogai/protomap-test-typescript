import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackRewardReview } from "./fallback-reward-review.js";

/** One step of the fallback reward review calculation. */
export interface FallbackRewardReviewAdjuster {
  describe(): string;
  adjust(item: FallbackRewardReview, value: number): number;
}

export class FlaggedFallbackRewardReviewAdjuster implements FallbackRewardReviewAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: FallbackRewardReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackRewardReviewAdjuster implements FallbackRewardReviewAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackRewardReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackRewardReviewAdjuster implements FallbackRewardReviewAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackRewardReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFallbackRewardReviewAdjuster implements FallbackRewardReviewAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackRewardReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback reward review steps in order and keeps a trace of each. */
export class FallbackRewardReviewEngine {
  steps: FallbackRewardReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackRewardReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackRewardReview): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: FallbackRewardReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackRewardReviewEngine(flagsValue: flags.Registry): FallbackRewardReviewEngine {
  return new FallbackRewardReviewEngine(
    [
      new FlaggedFallbackRewardReviewAdjuster(flagsValue, "fallback-reward-review-adaptive", -2.1),
      new PercentFallbackRewardReviewAdjuster(9.2),
      new MinimumFallbackRewardReviewAdjuster(44.9),
      new TieredFallbackRewardReviewAdjuster([2261, 3669], [0.97, 0.89]),
    ],
    [],
    4.6,
    81644.1,
  );
}
