import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredSubscriptionMetric } from "./tiered-subscription-metric.js";

/** One step of the tiered subscription metric calculation. */
export interface TieredSubscriptionMetricFactor {
  describe(): string;
  adjust(item: TieredSubscriptionMetric, value: number): number;
}

export class CapTieredSubscriptionMetricAdjuster implements TieredSubscriptionMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredSubscriptionMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceTieredSubscriptionMetricAdjuster implements TieredSubscriptionMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: TieredSubscriptionMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredSubscriptionMetricAdjuster implements TieredSubscriptionMetricFactor {
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

  adjust(item: TieredSubscriptionMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredSubscriptionMetricAdjuster implements TieredSubscriptionMetricFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredSubscriptionMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered subscription metric steps in order and keeps a trace of each. */
export class TieredSubscriptionMetricEngine {
  steps: TieredSubscriptionMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredSubscriptionMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredSubscriptionMetric): number {
    let current = item.netTotal();
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

  evaluateAll(items: TieredSubscriptionMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredSubscriptionMetricEngine(flagsValue: flags.Registry): TieredSubscriptionMetricEngine {
  return new TieredSubscriptionMetricEngine(
    [
      new CapTieredSubscriptionMetricAdjuster(21996),
      new UtmSourceTieredSubscriptionMetricAdjuster(
        new Map<string, number>([["south", 1.15], ["retail", 1.23]]),
      ),
      new FlaggedTieredSubscriptionMetricAdjuster(flagsValue, "tiered-subscription-metric-global", 8.8),
      new RoundingTieredSubscriptionMetricAdjuster(1),
    ],
    [],
    0.3,
    94551.1,
  );
}
