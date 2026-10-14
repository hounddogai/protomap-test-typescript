import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierMetric } from "./tier-metric.js";

/** One step of the tier metric calculation. */
export interface TierMetricStep {
  describe(): string;
  adjust(item: TierMetric, value: number): number;
}

export class FlaggedTierMetricAdjuster implements TierMetricStep {
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

  adjust(item: TierMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTierMetricAdjuster implements TierMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTierMetricAdjuster implements TierMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTierMetricAdjuster implements TierMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTierMetricAdjuster implements TierMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTierMetricAdjuster implements TierMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TierMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tier metric steps in order and keeps a trace of each. */
export class TierMetricEngine {
  steps: TierMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TierMetric): number {
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

  evaluateAll(items: TierMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTierMetricEngine(flagsValue: flags.Registry): TierMetricEngine {
  return new TierMetricEngine(
    [
      new FlaggedTierMetricAdjuster(flagsValue, "tier-metric-manual", 5.5),
      new CapTierMetricAdjuster(11612),
      new RoundingTierMetricAdjuster(0.25),
      new PercentTierMetricAdjuster(5),
      new MinimumTierMetricAdjuster(24.6),
      new TieredTierMetricAdjuster([1707, 2951], [1.07, 0.98]),
    ],
    [],
    4.3,
    44456.4,
  );
}
