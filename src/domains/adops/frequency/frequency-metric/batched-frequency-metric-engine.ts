import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedFrequencyMetric } from "./batched-frequency-metric.js";

/** One step of the batched frequency metric calculation. */
export interface BatchedFrequencyMetricFactor {
  describe(): string;
  adjust(item: BatchedFrequencyMetric, value: number): number;
}

export class PercentBatchedFrequencyMetricAdjuster implements BatchedFrequencyMetricFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedFrequencyMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BatchedFrequencyMetricClicksOffsetAdjuster implements BatchedFrequencyMetricFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: BatchedFrequencyMetric, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class SourceBatchedFrequencyMetricAdjuster implements BatchedFrequencyMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BatchedFrequencyMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBatchedFrequencyMetricAdjuster implements BatchedFrequencyMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedFrequencyMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBatchedFrequencyMetricAdjuster implements BatchedFrequencyMetricFactor {
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

  adjust(item: BatchedFrequencyMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched frequency metric steps in order and keeps a trace of each. */
export class BatchedFrequencyMetricEngine {
  steps: BatchedFrequencyMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedFrequencyMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedFrequencyMetric): number {
    let current = item.netVolume();
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

  evaluateAll(items: BatchedFrequencyMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedFrequencyMetricEngine(flagsValue: flags.Registry): BatchedFrequencyMetricEngine {
  return new BatchedFrequencyMetricEngine(
    [
      new PercentBatchedFrequencyMetricAdjuster(14.4),
      new BatchedFrequencyMetricClicksOffsetAdjuster(1.41),
      new SourceBatchedFrequencyMetricAdjuster(new Map<string, number>([["retail", 0.96]])),
      new MinimumBatchedFrequencyMetricAdjuster(28.2),
      new FlaggedBatchedFrequencyMetricAdjuster(flagsValue, "batched-frequency-metric-global", 5),
    ],
    [],
    4.6,
    15306.8,
  );
}
