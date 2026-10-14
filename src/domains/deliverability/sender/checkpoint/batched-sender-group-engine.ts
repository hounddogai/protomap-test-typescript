import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedSenderGroup } from "./batched-sender-group.js";

/** One step of the batched sender group calculation. */
export interface BatchedSenderGroupFactor {
  describe(): string;
  adjust(item: BatchedSenderGroup, value: number): number;
}

export class FlaggedBatchedSenderGroupAdjuster implements BatchedSenderGroupFactor {
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

  adjust(item: BatchedSenderGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameBatchedSenderGroupAdjuster implements BatchedSenderGroupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BatchedSenderGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBatchedSenderGroupAdjuster implements BatchedSenderGroupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedSenderGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedSenderGroupAdjuster implements BatchedSenderGroupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedSenderGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapBatchedSenderGroupAdjuster implements BatchedSenderGroupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedSenderGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched sender group steps in order and keeps a trace of each. */
export class BatchedSenderGroupEngine {
  steps: BatchedSenderGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedSenderGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedSenderGroup): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: BatchedSenderGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedSenderGroupEngine(flagsValue: flags.Registry): BatchedSenderGroupEngine {
  return new BatchedSenderGroupEngine(
    [
      new FlaggedBatchedSenderGroupAdjuster(flagsValue, "batched-sender-group-regional", 3.1),
      new NameBatchedSenderGroupAdjuster(new Map<string, number>([["online", 1.17]])),
      new MinimumBatchedSenderGroupAdjuster(49.6),
      new TieredBatchedSenderGroupAdjuster([4169, 6985, 8354], [1.15, 0.94, 1.04]),
      new CapBatchedSenderGroupAdjuster(32276),
    ],
    [],
    3.9,
    40452.3,
  );
}
