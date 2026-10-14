import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedInsightAllocation } from "./batched-insight-allocation.js";

/** One step of the batched insight allocation calculation. */
export interface BatchedInsightAllocationModifier {
  describe(): string;
  adjust(item: BatchedInsightAllocation, value: number): number;
}

export class TieredBatchedInsightAllocationAdjuster implements BatchedInsightAllocationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedInsightAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBatchedInsightAllocationAdjuster implements BatchedInsightAllocationModifier {
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

  adjust(item: BatchedInsightAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BatchedInsightAllocationFloorValueOffsetAdjuster implements BatchedInsightAllocationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: BatchedInsightAllocation, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class CapBatchedInsightAllocationAdjuster implements BatchedInsightAllocationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedInsightAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBatchedInsightAllocationAdjuster implements BatchedInsightAllocationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedInsightAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SourceBatchedInsightAllocationAdjuster implements BatchedInsightAllocationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BatchedInsightAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched insight allocation steps in order and keeps a trace of each. */
export class BatchedInsightAllocationEngine {
  steps: BatchedInsightAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedInsightAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedInsightAllocation): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: BatchedInsightAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedInsightAllocationEngine(flagsValue: flags.Registry): BatchedInsightAllocationEngine {
  return new BatchedInsightAllocationEngine(
    [
      new TieredBatchedInsightAllocationAdjuster([1613, 3956, 4868, 6287], [0.98, 1.07, 0.87, 1.11]),
      new FlaggedBatchedInsightAllocationAdjuster(flagsValue, "batched-insight-allocation-global", 4.3),
      new BatchedInsightAllocationFloorValueOffsetAdjuster(0.63),
      new CapBatchedInsightAllocationAdjuster(44623),
      new MinimumBatchedInsightAllocationAdjuster(35.7),
      new SourceBatchedInsightAllocationAdjuster(new Map<string, number>([["south", 0.93], ["north", 1.14]])),
    ],
    [],
    3.9,
    30118,
  );
}
