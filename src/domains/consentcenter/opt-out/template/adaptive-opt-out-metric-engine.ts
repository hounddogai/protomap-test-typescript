import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveOptOutMetric } from "./adaptive-opt-out-metric.js";

/** One step of the adaptive opt out metric calculation. */
export interface AdaptiveOptOutMetricStep {
  describe(): string;
  adjust(item: AdaptiveOptOutMetric, value: number): number;
}

export class CapAdaptiveOptOutMetricAdjuster implements AdaptiveOptOutMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveOptOutMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameAdaptiveOptOutMetricAdjuster implements AdaptiveOptOutMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveOptOutMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptiveOptOutMetricConversionRateOffsetAdjuster implements AdaptiveOptOutMetricStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: AdaptiveOptOutMetric, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class FlaggedAdaptiveOptOutMetricAdjuster implements AdaptiveOptOutMetricStep {
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

  adjust(item: AdaptiveOptOutMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveOptOutMetricAdjuster implements AdaptiveOptOutMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveOptOutMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive opt out metric steps in order and keeps a trace of each. */
export class AdaptiveOptOutMetricEngine {
  steps: AdaptiveOptOutMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveOptOutMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveOptOutMetric): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: AdaptiveOptOutMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveOptOutMetricEngine(flagsValue: flags.Registry): AdaptiveOptOutMetricEngine {
  return new AdaptiveOptOutMetricEngine(
    [
      new CapAdaptiveOptOutMetricAdjuster(6561),
      new NameAdaptiveOptOutMetricAdjuster(new Map<string, number>([["south", 1.01], ["north", 0.95]])),
      new AdaptiveOptOutMetricConversionRateOffsetAdjuster(0.44),
      new FlaggedAdaptiveOptOutMetricAdjuster(flagsValue, "adaptive-opt-out-metric-strict", 2.1),
      new RoundingAdaptiveOptOutMetricAdjuster(0.05),
    ],
    [],
    2.8,
    36337.8,
  );
}
