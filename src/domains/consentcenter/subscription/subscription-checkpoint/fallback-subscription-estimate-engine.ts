import * as flags from "../../../../kit/flags.js";
import { FallbackSubscriptionEstimate } from "./fallback-subscription-estimate.js";

/** One step of the fallback subscription estimate calculation. */
export interface FallbackSubscriptionEstimateStep {
  describe(): string;
  adjust(item: FallbackSubscriptionEstimate, value: number): number;
}

export class FallbackSubscriptionEstimateDiscountOffsetAdjuster implements FallbackSubscriptionEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: FallbackSubscriptionEstimate, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class CategoryFallbackSubscriptionEstimateAdjuster implements FallbackSubscriptionEstimateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: FallbackSubscriptionEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackSubscriptionEstimateAdjuster implements FallbackSubscriptionEstimateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackSubscriptionEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFallbackSubscriptionEstimateAdjuster implements FallbackSubscriptionEstimateStep {
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

  adjust(item: FallbackSubscriptionEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackSubscriptionEstimateAdjuster implements FallbackSubscriptionEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackSubscriptionEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback subscription estimate steps in order and keeps a trace of each. */
export class FallbackSubscriptionEstimateEngine {
  steps: FallbackSubscriptionEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSubscriptionEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackSubscriptionEstimate): number {
    let current = item.netVolume();
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

  evaluateAll(items: FallbackSubscriptionEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackSubscriptionEstimateEngine(flagsValue: flags.Registry): FallbackSubscriptionEstimateEngine {
  return new FallbackSubscriptionEstimateEngine(
    [
      new FallbackSubscriptionEstimateDiscountOffsetAdjuster(1.85),
      new CategoryFallbackSubscriptionEstimateAdjuster(
        new Map<string, number>([["online", 1.09], ["south", 0.94], ["central", 1.24]]),
      ),
      new MinimumFallbackSubscriptionEstimateAdjuster(28.8),
      new FlaggedFallbackSubscriptionEstimateAdjuster(flagsValue, "fallback-subscription-estimate-capped", 2.6),
      new CapFallbackSubscriptionEstimateAdjuster(7359),
    ],
    [],
    1.2,
    18720.9,
  );
}
