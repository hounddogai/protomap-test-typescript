import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionMetric } from "./subscription-metric.js";

/** One step of the subscription metric calculation. */
export interface SubscriptionMetricAdjuster {
  describe(): string;
  adjust(item: SubscriptionMetric, value: number): number;
}

export class FlaggedSubscriptionMetricAdjuster implements SubscriptionMetricAdjuster {
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

  adjust(item: SubscriptionMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSubscriptionMetricAdjuster implements SubscriptionMetricAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSubscriptionMetricAdjuster implements SubscriptionMetricAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSubscriptionMetricAdjuster implements SubscriptionMetricAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumSubscriptionMetricAdjuster implements SubscriptionMetricAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the subscription metric steps in order and keeps a trace of each. */
export class SubscriptionMetricEngine {
  steps: SubscriptionMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SubscriptionMetric): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: SubscriptionMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSubscriptionMetricEngine(flagsValue: flags.Registry): SubscriptionMetricEngine {
  return new SubscriptionMetricEngine(
    [
      new FlaggedSubscriptionMetricAdjuster(flagsValue, "subscription-metric-primary", 4.1),
      new TieredSubscriptionMetricAdjuster([797, 1299, 9804], [1.16, 0.87, 1.14]),
      new CapSubscriptionMetricAdjuster(21304),
      new RoundingSubscriptionMetricAdjuster(0.25),
      new MinimumSubscriptionMetricAdjuster(0.2),
    ],
    [],
    3.5,
    51043.9,
  );
}
