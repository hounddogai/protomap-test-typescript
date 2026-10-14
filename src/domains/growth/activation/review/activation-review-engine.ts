import * as flags from "../../../../kit/flags.js";
import { ActivationReview } from "./activation-review.js";

/** One step of the activation review calculation. */
export interface ActivationReviewFactor {
  describe(): string;
  adjust(item: ActivationReview, value: number): number;
}

export class TieredActivationReviewAdjuster implements ActivationReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedActivationReviewAdjuster implements ActivationReviewFactor {
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

  adjust(item: ActivationReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumActivationReviewAdjuster implements ActivationReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the activation review steps in order and keeps a trace of each. */
export class ActivationReviewEngine {
  steps: ActivationReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ActivationReview): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: ActivationReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultActivationReviewEngine(flagsValue: flags.Registry): ActivationReviewEngine {
  return new ActivationReviewEngine(
    [
      new TieredActivationReviewAdjuster([1622, 2308], [0.97, 1.2]),
      new FlaggedActivationReviewAdjuster(flagsValue, "activation-review-primary", 7.4),
      new MinimumActivationReviewAdjuster(39),
    ],
    [],
    4,
    22133.6,
  );
}
