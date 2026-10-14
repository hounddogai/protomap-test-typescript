import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingDomainMetric } from "./rolling-domain-metric.js";

/** One step of the rolling domain metric calculation. */
export interface RollingDomainMetricFactor {
  describe(): string;
  adjust(item: RollingDomainMetric, value: number): number;
}

export class PercentRollingDomainMetricAdjuster implements RollingDomainMetricFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingDomainMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionRollingDomainMetricAdjuster implements RollingDomainMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RollingDomainMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRollingDomainMetricAdjuster implements RollingDomainMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingDomainMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRollingDomainMetricAdjuster implements RollingDomainMetricFactor {
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

  adjust(item: RollingDomainMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingDomainMetricAdjuster implements RollingDomainMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingDomainMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRollingDomainMetricAdjuster implements RollingDomainMetricFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingDomainMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling domain metric steps in order and keeps a trace of each. */
export class RollingDomainMetricEngine {
  steps: RollingDomainMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingDomainMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingDomainMetric): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: RollingDomainMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingDomainMetricEngine(flagsValue: flags.Registry): RollingDomainMetricEngine {
  return new RollingDomainMetricEngine(
    [
      new PercentRollingDomainMetricAdjuster(-20.9),
      new RegionRollingDomainMetricAdjuster(new Map<string, number>([["east", 1.14], ["central", 1.3]])),
      new CapRollingDomainMetricAdjuster(42189),
      new FlaggedRollingDomainMetricAdjuster(flagsValue, "rolling-domain-metric-tiered", -9.2),
      new MinimumRollingDomainMetricAdjuster(27.9),
      new TieredRollingDomainMetricAdjuster([891, 1910], [1.14, 0.82]),
    ],
    [],
    3.9,
    98209.5,
  );
}
