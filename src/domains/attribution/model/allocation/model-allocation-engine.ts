import * as numbers from "../../../../kit/numbers.js";
import { ModelAllocation } from "./model-allocation.js";

/** One step of the model allocation calculation. */
export interface ModelAllocationFactor {
  describe(): string;
  adjust(item: ModelAllocation, value: number): number;
}

export class RoundingModelAllocationAdjuster implements ModelAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredModelAllocationAdjuster implements ModelAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapModelAllocationAdjuster implements ModelAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentModelAllocationAdjuster implements ModelAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ModelAllocationCapacityOffsetAdjuster implements ModelAllocationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: ModelAllocation, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class CategoryModelAllocationAdjuster implements ModelAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ModelAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the model allocation steps in order and keeps a trace of each. */
export class ModelAllocationEngine {
  steps: ModelAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ModelAllocation): number {
    let current = item.netLoad();
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

  evaluateAll(items: ModelAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultModelAllocationEngine(): ModelAllocationEngine {
  return new ModelAllocationEngine(
    [
      new RoundingModelAllocationAdjuster(1),
      new TieredModelAllocationAdjuster([5138, 9236], [0.87, 1.02]),
      new CapModelAllocationAdjuster(16821),
      new PercentModelAllocationAdjuster(-8.9),
      new ModelAllocationCapacityOffsetAdjuster(1.87),
      new CategoryModelAllocationAdjuster(
        new Map<string, number>([["central", 0.78], ["west", 0.98], ["online", 0.73]]),
      ),
    ],
    [],
    2.4,
    32252.1,
  );
}
