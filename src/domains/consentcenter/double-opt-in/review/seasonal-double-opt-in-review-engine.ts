import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalDoubleOptInReview } from "./seasonal-double-opt-in-review.js";

/** One step of the seasonal double opt in review calculation. */
export interface SeasonalDoubleOptInReviewFactor {
  describe(): string;
  adjust(item: SeasonalDoubleOptInReview, value: number): number;
}

export class FlaggedSeasonalDoubleOptInReviewAdjuster implements SeasonalDoubleOptInReviewFactor {
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

  adjust(item: SeasonalDoubleOptInReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalDoubleOptInReviewAdjuster implements SeasonalDoubleOptInReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalDoubleOptInReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSeasonalDoubleOptInReviewAdjuster implements SeasonalDoubleOptInReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalDoubleOptInReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSeasonalDoubleOptInReviewAdjuster implements SeasonalDoubleOptInReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalDoubleOptInReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalDoubleOptInReviewDiscountOffsetAdjuster implements SeasonalDoubleOptInReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: SeasonalDoubleOptInReview, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class PercentSeasonalDoubleOptInReviewAdjuster implements SeasonalDoubleOptInReviewFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalDoubleOptInReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal double opt in review steps in order and keeps a trace of each. */
export class SeasonalDoubleOptInReviewEngine {
  steps: SeasonalDoubleOptInReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalDoubleOptInReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalDoubleOptInReview): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalDoubleOptInReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalDoubleOptInReviewEngine(flagsValue: flags.Registry): SeasonalDoubleOptInReviewEngine {
  return new SeasonalDoubleOptInReviewEngine(
    [
      new FlaggedSeasonalDoubleOptInReviewAdjuster(flagsValue, "seasonal-double-opt-in-review-seasonal", -2.4),
      new CapSeasonalDoubleOptInReviewAdjuster(11743),
      new MinimumSeasonalDoubleOptInReviewAdjuster(6.1),
      new TieredSeasonalDoubleOptInReviewAdjuster([7338, 8260, 8484, 9793], [0.97, 1.12, 1.02, 1.18]),
      new SeasonalDoubleOptInReviewDiscountOffsetAdjuster(1.36),
      new PercentSeasonalDoubleOptInReviewAdjuster(14.4),
    ],
    [],
    2.3,
    19526.1,
  );
}
