import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedWindowReview } from "./weighted-window-review.js";

/** One step of the weighted window review calculation. */
export interface WeightedWindowReviewAdjuster {
  describe(): string;
  adjust(item: WeightedWindowReview, value: number): number;
}

export class CapWeightedWindowReviewAdjuster implements WeightedWindowReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedWindowReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentWeightedWindowReviewAdjuster implements WeightedWindowReviewAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedWindowReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedWeightedWindowReviewAdjuster implements WeightedWindowReviewAdjuster {
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

  adjust(item: WeightedWindowReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelWeightedWindowReviewAdjuster implements WeightedWindowReviewAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedWindowReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWeightedWindowReviewAdjuster implements WeightedWindowReviewAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedWindowReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingWeightedWindowReviewAdjuster implements WeightedWindowReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedWindowReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted window review steps in order and keeps a trace of each. */
export class WeightedWindowReviewEngine {
  steps: WeightedWindowReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWindowReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedWindowReview): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: WeightedWindowReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedWindowReviewEngine(flagsValue: flags.Registry): WeightedWindowReviewEngine {
  return new WeightedWindowReviewEngine(
    [
      new CapWeightedWindowReviewAdjuster(3002),
      new PercentWeightedWindowReviewAdjuster(-19.2),
      new FlaggedWeightedWindowReviewAdjuster(flagsValue, "weighted-window-review-fallback", 2.7),
      new ChannelWeightedWindowReviewAdjuster(
        new Map<string, number>([["south", 1.21], ["central", 0.9], ["east", 1.36]]),
      ),
      new TieredWeightedWindowReviewAdjuster([1338, 1880, 3593, 5671], [0.98, 1.09, 0.86, 1.17]),
      new RoundingWeightedWindowReviewAdjuster(0.5),
    ],
    [],
    0.9,
    70617.5,
  );
}
