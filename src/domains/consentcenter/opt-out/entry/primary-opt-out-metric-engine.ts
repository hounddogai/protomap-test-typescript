import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryOptOutMetric } from "./primary-opt-out-metric.js";

/** One step of the primary opt out metric calculation. */
export interface PrimaryOptOutMetricFactor {
  describe(): string;
  adjust(item: PrimaryOptOutMetric, value: number): number;
}

export class RoundingPrimaryOptOutMetricAdjuster implements PrimaryOptOutMetricFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryOptOutMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimaryOptOutMetricAdjuster implements PrimaryOptOutMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryOptOutMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPrimaryOptOutMetricAdjuster implements PrimaryOptOutMetricFactor {
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

  adjust(item: PrimaryOptOutMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPrimaryOptOutMetricAdjuster implements PrimaryOptOutMetricFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryOptOutMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPrimaryOptOutMetricAdjuster implements PrimaryOptOutMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryOptOutMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary opt out metric steps in order and keeps a trace of each. */
export class PrimaryOptOutMetricEngine {
  steps: PrimaryOptOutMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryOptOutMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryOptOutMetric): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PrimaryOptOutMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryOptOutMetricEngine(flagsValue: flags.Registry): PrimaryOptOutMetricEngine {
  return new PrimaryOptOutMetricEngine(
    [
      new RoundingPrimaryOptOutMetricAdjuster(0.25),
      new CapPrimaryOptOutMetricAdjuster(30488),
      new FlaggedPrimaryOptOutMetricAdjuster(flagsValue, "primary-opt-out-metric-global", -6.7),
      new PercentPrimaryOptOutMetricAdjuster(22.3),
      new MinimumPrimaryOptOutMetricAdjuster(15.4),
    ],
    [],
    3.5,
    83461.5,
  );
}
