import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedFrequencyReview } from "./capped-frequency-review.js";

/** One step of the capped frequency review calculation. */
export interface CappedFrequencyReviewStep {
  describe(): string;
  adjust(item: CappedFrequencyReview, value: number): number;
}

export class MinimumCappedFrequencyReviewAdjuster implements CappedFrequencyReviewStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedFrequencyReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCappedFrequencyReviewAdjuster implements CappedFrequencyReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedFrequencyReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCappedFrequencyReviewAdjuster implements CappedFrequencyReviewStep {
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

  adjust(item: CappedFrequencyReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCappedFrequencyReviewAdjuster implements CappedFrequencyReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedFrequencyReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CappedFrequencyReviewRatioOffsetAdjuster implements CappedFrequencyReviewStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: CappedFrequencyReview, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class CapCappedFrequencyReviewAdjuster implements CappedFrequencyReviewStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedFrequencyReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the capped frequency review steps in order and keeps a trace of each. */
export class CappedFrequencyReviewEngine {
  steps: CappedFrequencyReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedFrequencyReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedFrequencyReview): number {
    let current = item.netExposure();
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

  evaluateAll(items: CappedFrequencyReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedFrequencyReviewEngine(flagsValue: flags.Registry): CappedFrequencyReviewEngine {
  return new CappedFrequencyReviewEngine(
    [
      new MinimumCappedFrequencyReviewAdjuster(37.3),
      new RoundingCappedFrequencyReviewAdjuster(0.5),
      new FlaggedCappedFrequencyReviewAdjuster(flagsValue, "capped-frequency-review-legacy", 8.1),
      new TieredCappedFrequencyReviewAdjuster([8893, 9820], [0.85, 1.03]),
      new CappedFrequencyReviewRatioOffsetAdjuster(0.28),
      new CapCappedFrequencyReviewAdjuster(39529),
    ],
    [],
    1.4,
    88930.6,
  );
}
