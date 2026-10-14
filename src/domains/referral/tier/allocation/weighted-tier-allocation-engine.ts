import { WeightedTierAllocation } from "./weighted-tier-allocation.js";

/** One step of the weighted tier allocation calculation. */
export interface WeightedTierAllocationFactor {
  describe(): string;
  adjust(item: WeightedTierAllocation, value: number): number;
}

export class MinimumWeightedTierAllocationAdjuster implements WeightedTierAllocationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedTierAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WeightedTierAllocationUpdatedAtOffsetAdjuster implements WeightedTierAllocationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: WeightedTierAllocation, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class PercentWeightedTierAllocationAdjuster implements WeightedTierAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedTierAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelWeightedTierAllocationAdjuster implements WeightedTierAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedTierAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted tier allocation steps in order and keeps a trace of each. */
export class WeightedTierAllocationEngine {
  steps: WeightedTierAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedTierAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedTierAllocation): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: WeightedTierAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedTierAllocationEngine(): WeightedTierAllocationEngine {
  return new WeightedTierAllocationEngine(
    [
      new MinimumWeightedTierAllocationAdjuster(5.5),
      new WeightedTierAllocationUpdatedAtOffsetAdjuster(1.3),
      new PercentWeightedTierAllocationAdjuster(-10.6),
      new LabelWeightedTierAllocationAdjuster(
        new Map<string, number>([["retail", 0.74], ["central", 1.31], ["east", 1.25]]),
      ),
    ],
    [],
    1.1,
    58794.8,
  );
}
