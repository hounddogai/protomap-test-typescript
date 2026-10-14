import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredDomainMetric } from "./tiered-domain-metric.js";

/** One step of the tiered domain metric calculation. */
export interface TieredDomainMetricStep {
  describe(): string;
  adjust(item: TieredDomainMetric, value: number): number;
}

export class FlaggedTieredDomainMetricAdjuster implements TieredDomainMetricStep {
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

  adjust(item: TieredDomainMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredDomainMetricAdjuster implements TieredDomainMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredDomainMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDomainMetricExpiresAtOffsetAdjuster implements TieredDomainMetricStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: TieredDomainMetric, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class MinimumTieredDomainMetricAdjuster implements TieredDomainMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredDomainMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered domain metric steps in order and keeps a trace of each. */
export class TieredDomainMetricEngine {
  steps: TieredDomainMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredDomainMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredDomainMetric): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: TieredDomainMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredDomainMetricEngine(flagsValue: flags.Registry): TieredDomainMetricEngine {
  return new TieredDomainMetricEngine(
    [
      new FlaggedTieredDomainMetricAdjuster(flagsValue, "tiered-domain-metric-rolling", -6.4),
      new PercentTieredDomainMetricAdjuster(-19),
      new TieredDomainMetricExpiresAtOffsetAdjuster(0.23),
      new MinimumTieredDomainMetricAdjuster(6.6),
    ],
    [],
    2.2,
    62958.9,
  );
}
