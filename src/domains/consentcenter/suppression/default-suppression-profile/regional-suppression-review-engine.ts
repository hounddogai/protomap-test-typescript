import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalSuppressionReview } from "./regional-suppression-review.js";

/** One step of the regional suppression review calculation. */
export interface RegionalSuppressionReviewStep {
  describe(): string;
  adjust(item: RegionalSuppressionReview, value: number): number;
}

export class RoundingRegionalSuppressionReviewAdjuster implements RegionalSuppressionReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalSuppressionReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRegionalSuppressionReviewAdjuster implements RegionalSuppressionReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalSuppressionReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRegionalSuppressionReviewAdjuster implements RegionalSuppressionReviewStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalSuppressionReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRegionalSuppressionReviewAdjuster implements RegionalSuppressionReviewStep {
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

  adjust(item: RegionalSuppressionReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionalSuppressionReviewUpdatedAtOffsetAdjuster implements RegionalSuppressionReviewStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: RegionalSuppressionReview, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the regional suppression review steps in order and keeps a trace of each. */
export class RegionalSuppressionReviewEngine {
  steps: RegionalSuppressionReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalSuppressionReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalSuppressionReview): number {
    let current = item.netValue();
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

  evaluateAll(items: RegionalSuppressionReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalSuppressionReviewEngine(flagsValue: flags.Registry): RegionalSuppressionReviewEngine {
  return new RegionalSuppressionReviewEngine(
    [
      new RoundingRegionalSuppressionReviewAdjuster(0.25),
      new TieredRegionalSuppressionReviewAdjuster([3898, 6985, 9860], [1.18, 1.14, 1.18]),
      new MinimumRegionalSuppressionReviewAdjuster(16.5),
      new FlaggedRegionalSuppressionReviewAdjuster(flagsValue, "regional-suppression-review-legacy", -4.2),
      new RegionalSuppressionReviewUpdatedAtOffsetAdjuster(0.51),
    ],
    [],
    0.9,
    13548.1,
  );
}
