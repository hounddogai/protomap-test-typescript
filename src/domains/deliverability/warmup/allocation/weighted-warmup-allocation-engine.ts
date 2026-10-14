import * as numbers from "../../../../kit/numbers.js";
import { WeightedWarmupAllocation } from "./weighted-warmup-allocation.js";

/** One step of the weighted warmup allocation calculation. */
export interface WeightedWarmupAllocationFactor {
  describe(): string;
  adjust(item: WeightedWarmupAllocation, value: number): number;
}

export class CategoryWeightedWarmupAllocationAdjuster implements WeightedWarmupAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: WeightedWarmupAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWeightedWarmupAllocationAdjuster implements WeightedWarmupAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedWarmupAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapWeightedWarmupAllocationAdjuster implements WeightedWarmupAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedWarmupAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentWeightedWarmupAllocationAdjuster implements WeightedWarmupAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedWarmupAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWeightedWarmupAllocationAdjuster implements WeightedWarmupAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedWarmupAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted warmup allocation steps in order and keeps a trace of each. */
export class WeightedWarmupAllocationEngine {
  steps: WeightedWarmupAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWarmupAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedWarmupAllocation): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WeightedWarmupAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedWarmupAllocationEngine(): WeightedWarmupAllocationEngine {
  return new WeightedWarmupAllocationEngine(
    [
      new CategoryWeightedWarmupAllocationAdjuster(
        new Map<string, number>([["south", 1.04], ["online", 0.86], ["east", 1.35]]),
      ),
      new TieredWeightedWarmupAllocationAdjuster([1546, 7939], [0.88, 1.02]),
      new CapWeightedWarmupAllocationAdjuster(11473),
      new PercentWeightedWarmupAllocationAdjuster(-14.5),
      new RoundingWeightedWarmupAllocationAdjuster(0.5),
    ],
    [],
    0.5,
    83716.4,
  );
}
