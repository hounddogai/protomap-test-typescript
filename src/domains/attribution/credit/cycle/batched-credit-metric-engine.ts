import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedCreditMetric } from "./batched-credit-metric.js";

/** One step of the batched credit metric calculation. */
export interface BatchedCreditMetricStep {
  describe(): string;
  adjust(item: BatchedCreditMetric, value: number): number;
}

export class FlaggedBatchedCreditMetricAdjuster implements BatchedCreditMetricStep {
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

  adjust(item: BatchedCreditMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedCreditMetricAdjuster implements BatchedCreditMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedCreditMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBatchedCreditMetricAdjuster implements BatchedCreditMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedCreditMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedCreditMetricAdjuster implements BatchedCreditMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedCreditMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedCreditMetricAdjuster implements BatchedCreditMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedCreditMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched credit metric steps in order and keeps a trace of each. */
export class BatchedCreditMetricEngine {
  steps: BatchedCreditMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedCreditMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedCreditMetric): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: BatchedCreditMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedCreditMetricEngine(flagsValue: flags.Registry): BatchedCreditMetricEngine {
  return new BatchedCreditMetricEngine(
    [
      new FlaggedBatchedCreditMetricAdjuster(flagsValue, "batched-credit-metric-tiered", 0.8),
      new RoundingBatchedCreditMetricAdjuster(0.05),
      new PercentBatchedCreditMetricAdjuster(14.2),
      new MinimumBatchedCreditMetricAdjuster(19),
      new TieredBatchedCreditMetricAdjuster([7544, 8084], [0.84, 1.19]),
    ],
    [],
    2.8,
    83487.3,
  );
}
