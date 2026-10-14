import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionVariance } from "./subscription-variance.js";

/** One step of the subscription variance calculation. */
export interface SubscriptionVarianceStep {
  describe(): string;
  adjust(item: SubscriptionVariance, value: number): number;
}

export class FlaggedSubscriptionVarianceAdjuster implements SubscriptionVarianceStep {
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

  adjust(item: SubscriptionVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSubscriptionVarianceAdjuster implements SubscriptionVarianceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSubscriptionVarianceAdjuster implements SubscriptionVarianceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSubscriptionVarianceAdjuster implements SubscriptionVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the subscription variance steps in order and keeps a trace of each. */
export class SubscriptionVarianceEngine {
  steps: SubscriptionVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SubscriptionVariance): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SubscriptionVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSubscriptionVarianceEngine(flagsValue: flags.Registry): SubscriptionVarianceEngine {
  return new SubscriptionVarianceEngine(
    [
      new FlaggedSubscriptionVarianceAdjuster(flagsValue, "subscription-variance-capped", -2.9),
      new RoundingSubscriptionVarianceAdjuster(5),
      new TieredSubscriptionVarianceAdjuster([5479, 7519, 8029], [1.08, 1.07, 1.03]),
      new CapSubscriptionVarianceAdjuster(9009),
    ],
    [],
    2.2,
    89450.3,
  );
}
