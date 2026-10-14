import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedActivationBatch } from "./batched-activation-batch.js";

/** One step of the batched activation batch calculation. */
export interface BatchedActivationBatchStep {
  describe(): string;
  adjust(item: BatchedActivationBatch, value: number): number;
}

export class MinimumBatchedActivationBatchAdjuster implements BatchedActivationBatchStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedActivationBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedActivationBatchAdjuster implements BatchedActivationBatchStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedActivationBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBatchedActivationBatchAdjuster implements BatchedActivationBatchStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedActivationBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedActivationBatchAdjuster implements BatchedActivationBatchStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedActivationBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryBatchedActivationBatchAdjuster implements BatchedActivationBatchStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BatchedActivationBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBatchedActivationBatchAdjuster implements BatchedActivationBatchStep {
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

  adjust(item: BatchedActivationBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched activation batch steps in order and keeps a trace of each. */
export class BatchedActivationBatchEngine {
  steps: BatchedActivationBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedActivationBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedActivationBatch): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: BatchedActivationBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedActivationBatchEngine(flagsValue: flags.Registry): BatchedActivationBatchEngine {
  return new BatchedActivationBatchEngine(
    [
      new MinimumBatchedActivationBatchAdjuster(32.9),
      new TieredBatchedActivationBatchAdjuster([905, 3194], [1.16, 1.18]),
      new PercentBatchedActivationBatchAdjuster(7.4),
      new CapBatchedActivationBatchAdjuster(42973),
      new CountryBatchedActivationBatchAdjuster(
        new Map<string, number>([["east", 0.96], ["west", 0.92], ["central", 1.06]]),
      ),
      new FlaggedBatchedActivationBatchAdjuster(flagsValue, "batched-activation-batch-seasonal", -0.9),
    ],
    [],
    3.1,
    35416.4,
  );
}
