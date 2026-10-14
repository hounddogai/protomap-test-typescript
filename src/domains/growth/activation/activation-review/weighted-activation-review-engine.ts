import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedActivationReview } from "./weighted-activation-review.js";

/** One step of the weighted activation review calculation. */
export interface WeightedActivationReviewAdjuster {
  describe(): string;
  adjust(item: WeightedActivationReview, value: number): number;
}

export class MinimumWeightedActivationReviewAdjuster implements WeightedActivationReviewAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedActivationReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredWeightedActivationReviewAdjuster implements WeightedActivationReviewAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedActivationReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameWeightedActivationReviewAdjuster implements WeightedActivationReviewAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WeightedActivationReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWeightedActivationReviewAdjuster implements WeightedActivationReviewAdjuster {
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

  adjust(item: WeightedActivationReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedActivationReviewAdjuster implements WeightedActivationReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedActivationReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWeightedActivationReviewAdjuster implements WeightedActivationReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedActivationReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted activation review steps in order and keeps a trace of each. */
export class WeightedActivationReviewEngine {
  steps: WeightedActivationReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedActivationReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedActivationReview): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: WeightedActivationReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedActivationReviewEngine(flagsValue: flags.Registry): WeightedActivationReviewEngine {
  return new WeightedActivationReviewEngine(
    [
      new MinimumWeightedActivationReviewAdjuster(24.2),
      new TieredWeightedActivationReviewAdjuster([1589, 9349, 9950], [1.16, 1.04, 1.13]),
      new NameWeightedActivationReviewAdjuster(new Map<string, number>([["west", 0.74], ["east", 0.94]])),
      new FlaggedWeightedActivationReviewAdjuster(flagsValue, "weighted-activation-review-regional", 8.3),
      new CapWeightedActivationReviewAdjuster(46689),
      new RoundingWeightedActivationReviewAdjuster(0.25),
    ],
    [],
    4.7,
    9594.9,
  );
}
