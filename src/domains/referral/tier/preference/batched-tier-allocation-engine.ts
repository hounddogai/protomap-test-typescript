import * as numbers from "../../../../kit/numbers.js";
import { BatchedTierAllocation } from "./batched-tier-allocation.js";

/** One step of the batched tier allocation calculation. */
export interface BatchedTierAllocationStep {
  describe(): string;
  adjust(item: BatchedTierAllocation, value: number): number;
}

export class RoundingBatchedTierAllocationAdjuster implements BatchedTierAllocationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedTierAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBatchedTierAllocationAdjuster implements BatchedTierAllocationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedTierAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedTierAllocationAdjuster implements BatchedTierAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedTierAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedTierAllocationAdjuster implements BatchedTierAllocationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedTierAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched tier allocation steps in order and keeps a trace of each. */
export class BatchedTierAllocationEngine {
  steps: BatchedTierAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedTierAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedTierAllocation): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: BatchedTierAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedTierAllocationEngine(): BatchedTierAllocationEngine {
  return new BatchedTierAllocationEngine(
    [
      new RoundingBatchedTierAllocationAdjuster(0.5),
      new MinimumBatchedTierAllocationAdjuster(30.4),
      new PercentBatchedTierAllocationAdjuster(-0.9),
      new TieredBatchedTierAllocationAdjuster([2834, 9932], [0.84, 0.9]),
    ],
    [],
    3.5,
    95723.5,
  );
}
