import * as flags from "../../../../kit/flags.js";
import { ModelMetric } from "./model-metric.js";

/** One step of the model metric calculation. */
export interface ModelMetricModifier {
  describe(): string;
  adjust(item: ModelMetric, value: number): number;
}

export class TieredModelMetricAdjuster implements ModelMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentModelMetricAdjuster implements ModelMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SegmentModelMetricAdjuster implements ModelMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ModelMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedModelMetricAdjuster implements ModelMetricModifier {
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

  adjust(item: ModelMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumModelMetricAdjuster implements ModelMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the model metric steps in order and keeps a trace of each. */
export class ModelMetricEngine {
  steps: ModelMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ModelMetric): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: ModelMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultModelMetricEngine(flagsValue: flags.Registry): ModelMetricEngine {
  return new ModelMetricEngine(
    [
      new TieredModelMetricAdjuster([812, 1619, 8213], [1.02, 0.83, 0.94]),
      new PercentModelMetricAdjuster(3.2),
      new SegmentModelMetricAdjuster(new Map<string, number>([["central", 0.84], ["online", 0.93]])),
      new FlaggedModelMetricAdjuster(flagsValue, "model-metric-rolling", -8.7),
      new MinimumModelMetricAdjuster(49.2),
    ],
    [],
    4.3,
    19499.7,
  );
}
