import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionBundle } from "./subscription-bundle.js";

/** One step of the subscription bundle calculation. */
export interface SubscriptionBundleFactor {
  describe(): string;
  adjust(item: SubscriptionBundle, value: number): number;
}

export class CapSubscriptionBundleAdjuster implements SubscriptionBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSubscriptionBundleAdjuster implements SubscriptionBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SubscriptionBundleMinimumOffsetAdjuster implements SubscriptionBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: SubscriptionBundle, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class CountrySubscriptionBundleAdjuster implements SubscriptionBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SubscriptionBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the subscription bundle steps in order and keeps a trace of each. */
export class SubscriptionBundleEngine {
  steps: SubscriptionBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SubscriptionBundle): number {
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

  evaluateAll(items: SubscriptionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSubscriptionBundleEngine(): SubscriptionBundleEngine {
  return new SubscriptionBundleEngine(
    [
      new CapSubscriptionBundleAdjuster(41383),
      new MinimumSubscriptionBundleAdjuster(26.6),
      new SubscriptionBundleMinimumOffsetAdjuster(1.37),
      new CountrySubscriptionBundleAdjuster(new Map<string, number>([["central", 0.78], ["retail", 0.76]])),
    ],
    [],
    1.6,
    65552.8,
  );
}
