import { LegacyConversionMetric } from "./legacy-conversion-metric.js";

/** One step of the legacy conversion metric calculation. */
export interface LegacyConversionMetricFactor {
  describe(): string;
  adjust(item: LegacyConversionMetric, value: number): number;
}

export class MinimumLegacyConversionMetricAdjuster implements LegacyConversionMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyConversionMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLegacyConversionMetricAdjuster implements LegacyConversionMetricFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyConversionMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryLegacyConversionMetricAdjuster implements LegacyConversionMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: LegacyConversionMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLegacyConversionMetricAdjuster implements LegacyConversionMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyConversionMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LegacyConversionMetricCapacityOffsetAdjuster implements LegacyConversionMetricFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: LegacyConversionMetric, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the legacy conversion metric steps in order and keeps a trace of each. */
export class LegacyConversionMetricEngine {
  steps: LegacyConversionMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyConversionMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyConversionMetric): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: LegacyConversionMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyConversionMetricEngine(): LegacyConversionMetricEngine {
  return new LegacyConversionMetricEngine(
    [
      new MinimumLegacyConversionMetricAdjuster(1.7),
      new PercentLegacyConversionMetricAdjuster(1.2),
      new CountryLegacyConversionMetricAdjuster(new Map<string, number>([["online", 0.77]])),
      new CapLegacyConversionMetricAdjuster(19210),
      new LegacyConversionMetricCapacityOffsetAdjuster(1.17),
    ],
    [],
    0.1,
    27154.9,
  );
}
