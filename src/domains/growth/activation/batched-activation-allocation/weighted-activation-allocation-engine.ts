import * as numbers from "../../../../kit/numbers.js";
import { WeightedActivationAllocation } from "./weighted-activation-allocation.js";

/** One step of the weighted activation allocation calculation. */
export interface WeightedActivationAllocationAdjuster {
  describe(): string;
  adjust(item: WeightedActivationAllocation, value: number): number;
}

export class TieredWeightedActivationAllocationAdjuster implements WeightedActivationAllocationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedActivationAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameWeightedActivationAllocationAdjuster implements WeightedActivationAllocationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WeightedActivationAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedActivationAllocationAdjuster implements WeightedActivationAllocationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedActivationAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted activation allocation steps in order and keeps a trace of each. */
export class WeightedActivationAllocationEngine {
  steps: WeightedActivationAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedActivationAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedActivationAllocation): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: WeightedActivationAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedActivationAllocationEngine(): WeightedActivationAllocationEngine {
  return new WeightedActivationAllocationEngine(
    [
      new TieredWeightedActivationAllocationAdjuster([348, 3752, 4764, 8641], [0.88, 0.94, 1.13, 1.05]),
      new NameWeightedActivationAllocationAdjuster(new Map<string, number>([["retail", 0.82]])),
      new MinimumWeightedActivationAllocationAdjuster(38.5),
    ],
    [],
    1.6,
    91098.1,
  );
}
