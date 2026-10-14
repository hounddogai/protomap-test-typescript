import { OptOutAllocation } from "./opt-out-allocation.js";

/** One step of the opt out allocation calculation. */
export interface OptOutAllocationFactor {
  describe(): string;
  adjust(item: OptOutAllocation, value: number): number;
}

export class TieredOptOutAllocationAdjuster implements OptOutAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelOptOutAllocationAdjuster implements OptOutAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: OptOutAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class OptOutAllocationFrequencyCapOffsetAdjuster implements OptOutAllocationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: OptOutAllocation, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

/** Runs the opt out allocation steps in order and keeps a trace of each. */
export class OptOutAllocationEngine {
  steps: OptOutAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: OptOutAllocation): number {
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

  evaluateAll(items: OptOutAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultOptOutAllocationEngine(): OptOutAllocationEngine {
  return new OptOutAllocationEngine(
    [
      new TieredOptOutAllocationAdjuster([2393, 6138, 7355, 8077], [0.88, 0.81, 1.06, 0.87]),
      new LabelOptOutAllocationAdjuster(new Map<string, number>([["south", 1.18]])),
      new OptOutAllocationFrequencyCapOffsetAdjuster(1.15),
    ],
    [],
    3.2,
    45523.2,
  );
}
