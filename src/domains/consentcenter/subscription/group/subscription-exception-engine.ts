import * as flags from "../../../../kit/flags.js";
import { SubscriptionException } from "./subscription-exception.js";

/** One step of the subscription exception calculation. */
export interface SubscriptionExceptionModifier {
  describe(): string;
  adjust(item: SubscriptionException, value: number): number;
}

export class CategorySubscriptionExceptionAdjuster implements SubscriptionExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: SubscriptionException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSubscriptionExceptionAdjuster implements SubscriptionExceptionModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSubscriptionExceptionAdjuster implements SubscriptionExceptionModifier {
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

  adjust(item: SubscriptionException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSubscriptionExceptionAdjuster implements SubscriptionExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the subscription exception steps in order and keeps a trace of each. */
export class SubscriptionExceptionEngine {
  steps: SubscriptionExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SubscriptionException): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: SubscriptionException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSubscriptionExceptionEngine(flagsValue: flags.Registry): SubscriptionExceptionEngine {
  return new SubscriptionExceptionEngine(
    [
      new CategorySubscriptionExceptionAdjuster(
        new Map<string, number>([["east", 0.98], ["west", 0.85], ["retail", 1.3]]),
      ),
      new TieredSubscriptionExceptionAdjuster([2338, 3218, 3255, 3331], [1.13, 1.05, 1.11, 0.83]),
      new FlaggedSubscriptionExceptionAdjuster(flagsValue, "subscription-exception-manual", 5.8),
      new PercentSubscriptionExceptionAdjuster(3.9),
    ],
    [],
    2.2,
    61250.4,
  );
}
