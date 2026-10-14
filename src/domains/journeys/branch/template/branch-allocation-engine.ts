import * as numbers from "../../../../kit/numbers.js";
import { BranchAllocation } from "./branch-allocation.js";

/** One step of the branch allocation calculation. */
export interface BranchAllocationAdjuster {
  describe(): string;
  adjust(item: BranchAllocation, value: number): number;
}

export class CapBranchAllocationAdjuster implements BranchAllocationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CategoryBranchAllocationAdjuster implements BranchAllocationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: BranchAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBranchAllocationAdjuster implements BranchAllocationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BranchAllocationQuantityOffsetAdjuster implements BranchAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: BranchAllocation, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class MinimumBranchAllocationAdjuster implements BranchAllocationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the branch allocation steps in order and keeps a trace of each. */
export class BranchAllocationEngine {
  steps: BranchAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BranchAllocation): number {
    let current = item.weightedValue();
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

  evaluateAll(items: BranchAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBranchAllocationEngine(): BranchAllocationEngine {
  return new BranchAllocationEngine(
    [
      new CapBranchAllocationAdjuster(40100),
      new CategoryBranchAllocationAdjuster(new Map<string, number>([["west", 0.74]])),
      new TieredBranchAllocationAdjuster([4678, 7091, 7906], [1.07, 1, 0.99]),
      new BranchAllocationQuantityOffsetAdjuster(0.95),
      new MinimumBranchAllocationAdjuster(27.7),
    ],
    [],
    2.4,
    49659.7,
  );
}
