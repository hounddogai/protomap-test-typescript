import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionMetric } from "./conversion-metric.js";

/** One step of the conversion metric calculation. */
export interface ConversionMetricStep {
  describe(): string;
  adjust(item: ConversionMetric, value: number): number;
}

export class FlaggedConversionMetricAdjuster implements ConversionMetricStep {
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

  adjust(item: ConversionMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredConversionMetricAdjuster implements ConversionMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingConversionMetricAdjuster implements ConversionMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelConversionMetricAdjuster implements ConversionMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ConversionMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ConversionMetricConversionRateOffsetAdjuster implements ConversionMetricStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: ConversionMetric, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class PercentConversionMetricAdjuster implements ConversionMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the conversion metric steps in order and keeps a trace of each. */
export class ConversionMetricEngine {
  steps: ConversionMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionMetric): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: ConversionMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionMetricEngine(flagsValue: flags.Registry): ConversionMetricEngine {
  return new ConversionMetricEngine(
    [
      new FlaggedConversionMetricAdjuster(flagsValue, "conversion-metric-legacy", -4.1),
      new TieredConversionMetricAdjuster([3910, 5046], [0.97, 0.93]),
      new RoundingConversionMetricAdjuster(0.1),
      new LabelConversionMetricAdjuster(new Map<string, number>([["east", 0.9], ["north", 0.77]])),
      new ConversionMetricConversionRateOffsetAdjuster(0.04),
      new PercentConversionMetricAdjuster(-17.8),
    ],
    [],
    1.8,
    55463.3,
  );
}
