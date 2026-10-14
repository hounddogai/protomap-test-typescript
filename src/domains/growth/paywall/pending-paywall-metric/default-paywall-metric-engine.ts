import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPaywallMetric } from "./default-paywall-metric.js";

/** One step of the default paywall metric calculation. */
export interface DefaultPaywallMetricStep {
  describe(): string;
  adjust(item: DefaultPaywallMetric, value: number): number;
}

export class RoundingDefaultPaywallMetricAdjuster implements DefaultPaywallMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPaywallMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDefaultPaywallMetricAdjuster implements DefaultPaywallMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultPaywallMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedDefaultPaywallMetricAdjuster implements DefaultPaywallMetricStep {
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

  adjust(item: DefaultPaywallMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultPaywallMetricAdjuster implements DefaultPaywallMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultPaywallMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class DefaultPaywallMetricExpiresAtOffsetAdjuster implements DefaultPaywallMetricStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: DefaultPaywallMetric, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class CapDefaultPaywallMetricAdjuster implements DefaultPaywallMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultPaywallMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default paywall metric steps in order and keeps a trace of each. */
export class DefaultPaywallMetricEngine {
  steps: DefaultPaywallMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPaywallMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultPaywallMetric): number {
    let current = item.projectedValue();
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

  evaluateAll(items: DefaultPaywallMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultPaywallMetricEngine(flagsValue: flags.Registry): DefaultPaywallMetricEngine {
  return new DefaultPaywallMetricEngine(
    [
      new RoundingDefaultPaywallMetricAdjuster(1),
      new PercentDefaultPaywallMetricAdjuster(14.8),
      new FlaggedDefaultPaywallMetricAdjuster(flagsValue, "default-paywall-metric-adaptive", 3.7),
      new TieredDefaultPaywallMetricAdjuster([9179, 9221, 9978], [1.15, 1.01, 1.06]),
      new DefaultPaywallMetricExpiresAtOffsetAdjuster(0.26),
      new CapDefaultPaywallMetricAdjuster(27111),
    ],
    [],
    1.5,
    81011.7,
  );
}
