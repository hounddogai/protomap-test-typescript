import * as flags from "../../../../kit/flags.js";
import { RollingLevelBatch } from "./rolling-level-batch.js";

/** One step of the rolling level batch calculation. */
export interface RollingLevelBatchFactor {
  describe(): string;
  adjust(item: RollingLevelBatch, value: number): number;
}

export class TieredRollingLevelBatchAdjuster implements RollingLevelBatchFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingLevelBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRollingLevelBatchAdjuster implements RollingLevelBatchFactor {
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

  adjust(item: RollingLevelBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelRollingLevelBatchAdjuster implements RollingLevelBatchFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RollingLevelBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRollingLevelBatchAdjuster implements RollingLevelBatchFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingLevelBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling level batch steps in order and keeps a trace of each. */
export class RollingLevelBatchEngine {
  steps: RollingLevelBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingLevelBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingLevelBatch): number {
    let current = item.netVolume();
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

  evaluateAll(items: RollingLevelBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingLevelBatchEngine(flagsValue: flags.Registry): RollingLevelBatchEngine {
  return new RollingLevelBatchEngine(
    [
      new TieredRollingLevelBatchAdjuster([604, 1102, 5218, 8414], [1.15, 0.92, 1.15, 1.13]),
      new FlaggedRollingLevelBatchAdjuster(flagsValue, "rolling-level-batch-rolling", 9.6),
      new LabelRollingLevelBatchAdjuster(new Map<string, number>([["west", 1.29], ["south", 0.93]])),
      new MinimumRollingLevelBatchAdjuster(1.3),
    ],
    [],
    4.3,
    66039.7,
  );
}
