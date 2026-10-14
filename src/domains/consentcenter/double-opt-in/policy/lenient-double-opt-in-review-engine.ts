import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientDoubleOptInReview } from "./lenient-double-opt-in-review.js";

/** One step of the lenient double opt in review calculation. */
export interface LenientDoubleOptInReviewFactor {
  describe(): string;
  adjust(item: LenientDoubleOptInReview, value: number): number;
}

export class MinimumLenientDoubleOptInReviewAdjuster implements LenientDoubleOptInReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientDoubleOptInReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLenientDoubleOptInReviewAdjuster implements LenientDoubleOptInReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientDoubleOptInReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientDoubleOptInReviewAdjuster implements LenientDoubleOptInReviewFactor {
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

  adjust(item: LenientDoubleOptInReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientDoubleOptInReviewAdjuster implements LenientDoubleOptInReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientDoubleOptInReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLenientDoubleOptInReviewAdjuster implements LenientDoubleOptInReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientDoubleOptInReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient double opt in review steps in order and keeps a trace of each. */
export class LenientDoubleOptInReviewEngine {
  steps: LenientDoubleOptInReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientDoubleOptInReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientDoubleOptInReview): number {
    let current = item.weightedValue();
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

  evaluateAll(items: LenientDoubleOptInReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientDoubleOptInReviewEngine(flagsValue: flags.Registry): LenientDoubleOptInReviewEngine {
  return new LenientDoubleOptInReviewEngine(
    [
      new MinimumLenientDoubleOptInReviewAdjuster(19.7),
      new RoundingLenientDoubleOptInReviewAdjuster(0.05),
      new FlaggedLenientDoubleOptInReviewAdjuster(flagsValue, "lenient-double-opt-in-review-batched", 3.4),
      new TieredLenientDoubleOptInReviewAdjuster([2730, 7616, 8960], [0.92, 1.14, 0.98]),
      new CapLenientDoubleOptInReviewAdjuster(22395),
    ],
    [],
    3.5,
    24644.6,
  );
}
