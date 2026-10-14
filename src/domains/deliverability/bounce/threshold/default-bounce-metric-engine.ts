import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultBounceMetric } from "./default-bounce-metric.js";

/** One step of the default bounce metric calculation. */
export interface DefaultBounceMetricAdjuster {
  describe(): string;
  adjust(item: DefaultBounceMetric, value: number): number;
}

export class FlaggedDefaultBounceMetricAdjuster implements DefaultBounceMetricAdjuster {
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

  adjust(item: DefaultBounceMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionDefaultBounceMetricAdjuster implements DefaultBounceMetricAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: DefaultBounceMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDefaultBounceMetricAdjuster implements DefaultBounceMetricAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultBounceMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDefaultBounceMetricAdjuster implements DefaultBounceMetricAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultBounceMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumDefaultBounceMetricAdjuster implements DefaultBounceMetricAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultBounceMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentDefaultBounceMetricAdjuster implements DefaultBounceMetricAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultBounceMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default bounce metric steps in order and keeps a trace of each. */
export class DefaultBounceMetricEngine {
  steps: DefaultBounceMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultBounceMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultBounceMetric): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: DefaultBounceMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultBounceMetricEngine(flagsValue: flags.Registry): DefaultBounceMetricEngine {
  return new DefaultBounceMetricEngine(
    [
      new FlaggedDefaultBounceMetricAdjuster(flagsValue, "default-bounce-metric-lenient", -2.1),
      new RegionDefaultBounceMetricAdjuster(new Map<string, number>([["retail", 0.88], ["south", 0.96]])),
      new TieredDefaultBounceMetricAdjuster([1658, 3858], [1.01, 1.19]),
      new CapDefaultBounceMetricAdjuster(42526),
      new MinimumDefaultBounceMetricAdjuster(10.4),
      new PercentDefaultBounceMetricAdjuster(-16.6),
    ],
    [],
    0.1,
    44622.1,
  );
}
