import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedCsatMetric } from "./batched-csat-metric.js";

/** One step of the batched csat metric calculation. */
export interface BatchedCsatMetricModifier {
  describe(): string;
  adjust(item: BatchedCsatMetric, value: number): number;
}

export class FlaggedBatchedCsatMetricAdjuster implements BatchedCsatMetricModifier {
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

  adjust(item: BatchedCsatMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedCsatMetricAdjuster implements BatchedCsatMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedCsatMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedCsatMetricAdjuster implements BatchedCsatMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedCsatMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedCsatMetricAdjuster implements BatchedCsatMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedCsatMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryBatchedCsatMetricAdjuster implements BatchedCsatMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BatchedCsatMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched csat metric steps in order and keeps a trace of each. */
export class BatchedCsatMetricEngine {
  steps: BatchedCsatMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedCsatMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedCsatMetric): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedCsatMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedCsatMetricEngine(flagsValue: flags.Registry): BatchedCsatMetricEngine {
  return new BatchedCsatMetricEngine(
    [
      new FlaggedBatchedCsatMetricAdjuster(flagsValue, "batched-csat-metric-regional", 7.2),
      new MinimumBatchedCsatMetricAdjuster(19.5),
      new PercentBatchedCsatMetricAdjuster(1.7),
      new RoundingBatchedCsatMetricAdjuster(0.05),
      new CountryBatchedCsatMetricAdjuster(new Map<string, number>([["south", 0.94], ["east", 1.03]])),
    ],
    [],
    3.8,
    83432.9,
  );
}
