import * as numbers from "../../../../kit/numbers.js";
import { PreferenceAllocation } from "./preference-allocation.js";

/** One step of the preference allocation calculation. */
export interface PreferenceAllocationFactor {
  describe(): string;
  adjust(item: PreferenceAllocation, value: number): number;
}

export class MinimumPreferenceAllocationAdjuster implements PreferenceAllocationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPreferenceAllocationAdjuster implements PreferenceAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPreferenceAllocationAdjuster implements PreferenceAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the preference allocation steps in order and keeps a trace of each. */
export class PreferenceAllocationEngine {
  steps: PreferenceAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PreferenceAllocation): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: PreferenceAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPreferenceAllocationEngine(): PreferenceAllocationEngine {
  return new PreferenceAllocationEngine(
    [
      new MinimumPreferenceAllocationAdjuster(42.1),
      new RoundingPreferenceAllocationAdjuster(0.05),
      new TieredPreferenceAllocationAdjuster([752, 6673, 7002], [1.1, 1.15, 1.2]),
    ],
    [],
    3.4,
    63800.8,
  );
}
