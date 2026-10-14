import * as flags from "../../../../kit/flags.js";
import { TieredExitRuleMetric } from "./tiered-exit-rule-metric.js";

/** One step of the tiered exit rule metric calculation. */
export interface TieredExitRuleMetricFactor {
  describe(): string;
  adjust(item: TieredExitRuleMetric, value: number): number;
}

export class TieredTieredExitRuleMetricAdjuster implements TieredExitRuleMetricFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredExitRuleMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleTieredExitRuleMetricAdjuster implements TieredExitRuleMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: TieredExitRuleMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentTieredExitRuleMetricAdjuster implements TieredExitRuleMetricFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredExitRuleMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredExitRuleMetricAdjuster implements TieredExitRuleMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredExitRuleMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTieredExitRuleMetricAdjuster implements TieredExitRuleMetricFactor {
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

  adjust(item: TieredExitRuleMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredExitRuleMetricClicksOffsetAdjuster implements TieredExitRuleMetricFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: TieredExitRuleMetric, value: number): number {
    return value + item.clicks * this.weight;
  }
}

/** Runs the tiered exit rule metric steps in order and keeps a trace of each. */
export class TieredExitRuleMetricEngine {
  steps: TieredExitRuleMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredExitRuleMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredExitRuleMetric): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: TieredExitRuleMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredExitRuleMetricEngine(flagsValue: flags.Registry): TieredExitRuleMetricEngine {
  return new TieredExitRuleMetricEngine(
    [
      new TieredTieredExitRuleMetricAdjuster([984, 7397, 8260, 9201], [0.95, 1, 1.2, 0.89]),
      new TitleTieredExitRuleMetricAdjuster(new Map<string, number>([["online", 1.2]])),
      new PercentTieredExitRuleMetricAdjuster(3.9),
      new CapTieredExitRuleMetricAdjuster(26683),
      new FlaggedTieredExitRuleMetricAdjuster(flagsValue, "tiered-exit-rule-metric-legacy", 5.3),
      new TieredExitRuleMetricClicksOffsetAdjuster(0.1),
    ],
    [],
    4.5,
    55007.8,
  );
}
