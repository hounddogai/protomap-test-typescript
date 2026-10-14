import * as flags from "../../../../kit/flags.js";
import { WeightedSubscriptionDigest } from "./weighted-subscription-digest.js";

/** One step of the weighted subscription digest calculation. */
export interface WeightedSubscriptionDigestFactor {
  describe(): string;
  adjust(item: WeightedSubscriptionDigest, value: number): number;
}

export class CategoryWeightedSubscriptionDigestAdjuster implements WeightedSubscriptionDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: WeightedSubscriptionDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedSubscriptionDigestAdjuster implements WeightedSubscriptionDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedSubscriptionDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WeightedSubscriptionDigestVersionOffsetAdjuster implements WeightedSubscriptionDigestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: WeightedSubscriptionDigest, value: number): number {
    return value + item.version * this.weight;
  }
}

export class FlaggedWeightedSubscriptionDigestAdjuster implements WeightedSubscriptionDigestFactor {
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

  adjust(item: WeightedSubscriptionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted subscription digest steps in order and keeps a trace of each. */
export class WeightedSubscriptionDigestEngine {
  steps: WeightedSubscriptionDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedSubscriptionDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedSubscriptionDigest): number {
    let current = item.weightedValue();
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

  evaluateAll(items: WeightedSubscriptionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedSubscriptionDigestEngine(flagsValue: flags.Registry): WeightedSubscriptionDigestEngine {
  return new WeightedSubscriptionDigestEngine(
    [
      new CategoryWeightedSubscriptionDigestAdjuster(new Map<string, number>([["west", 1.07]])),
      new MinimumWeightedSubscriptionDigestAdjuster(26.8),
      new WeightedSubscriptionDigestVersionOffsetAdjuster(0.24),
      new FlaggedWeightedSubscriptionDigestAdjuster(flagsValue, "weighted-subscription-digest-batched", 3.3),
    ],
    [],
    4.9,
    11121.9,
  );
}
