import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackChallengeReview } from "./fallback-challenge-review.js";

/** One step of the fallback challenge review calculation. */
export interface FallbackChallengeReviewStep {
  describe(): string;
  adjust(item: FallbackChallengeReview, value: number): number;
}

export class PercentFallbackChallengeReviewAdjuster implements FallbackChallengeReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackChallengeReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackChallengeReviewAdjuster implements FallbackChallengeReviewStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackChallengeReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FallbackChallengeReviewThresholdOffsetAdjuster implements FallbackChallengeReviewStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: FallbackChallengeReview, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class FlaggedFallbackChallengeReviewAdjuster implements FallbackChallengeReviewStep {
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

  adjust(item: FallbackChallengeReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackChallengeReviewAdjuster implements FallbackChallengeReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackChallengeReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback challenge review steps in order and keeps a trace of each. */
export class FallbackChallengeReviewEngine {
  steps: FallbackChallengeReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackChallengeReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackChallengeReview): number {
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

  evaluateAll(items: FallbackChallengeReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackChallengeReviewEngine(flagsValue: flags.Registry): FallbackChallengeReviewEngine {
  return new FallbackChallengeReviewEngine(
    [
      new PercentFallbackChallengeReviewAdjuster(10.7),
      new MinimumFallbackChallengeReviewAdjuster(12.9),
      new FallbackChallengeReviewThresholdOffsetAdjuster(0.06),
      new FlaggedFallbackChallengeReviewAdjuster(flagsValue, "fallback-challenge-review-legacy", -8.5),
      new TieredFallbackChallengeReviewAdjuster([4289, 5341, 8911], [1.11, 0.83, 0.82]),
    ],
    [],
    1.8,
    49484.5,
  );
}
