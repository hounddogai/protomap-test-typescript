import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedOptOutAllocation } from "./batched-opt-out-allocation.js";

/** One step of the batched opt out allocation calculation. */
export interface BatchedOptOutAllocationFactor {
  describe(): string;
  adjust(item: BatchedOptOutAllocation, value: number): number;
}

export class CapBatchedOptOutAllocationAdjuster implements BatchedOptOutAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedOptOutAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBatchedOptOutAllocationAdjuster implements BatchedOptOutAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedOptOutAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleBatchedOptOutAllocationAdjuster implements BatchedOptOutAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedOptOutAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBatchedOptOutAllocationAdjuster implements BatchedOptOutAllocationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedOptOutAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBatchedOptOutAllocationAdjuster implements BatchedOptOutAllocationFactor {
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

  adjust(item: BatchedOptOutAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedOptOutAllocationAdjuster implements BatchedOptOutAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedOptOutAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched opt out allocation steps in order and keeps a trace of each. */
export class BatchedOptOutAllocationEngine {
  steps: BatchedOptOutAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedOptOutAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedOptOutAllocation): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: BatchedOptOutAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedOptOutAllocationEngine(flagsValue: flags.Registry): BatchedOptOutAllocationEngine {
  return new BatchedOptOutAllocationEngine(
    [
      new CapBatchedOptOutAllocationAdjuster(37576),
      new RoundingBatchedOptOutAllocationAdjuster(0.05),
      new TitleBatchedOptOutAllocationAdjuster(new Map<string, number>([["online", 1.3], ["central", 1.29]])),
      new MinimumBatchedOptOutAllocationAdjuster(16.2),
      new FlaggedBatchedOptOutAllocationAdjuster(flagsValue, "batched-opt-out-allocation-batched", -1),
      new TieredBatchedOptOutAllocationAdjuster([6170, 9323], [0.99, 0.95]),
    ],
    [],
    0.8,
    83088,
  );
}
