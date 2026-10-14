import { PayoutAllocation } from "./payout-allocation.js";

/** One step of the payout allocation calculation. */
export interface PayoutAllocationStep {
  describe(): string;
  adjust(item: PayoutAllocation, value: number): number;
}

export class TitlePayoutAllocationAdjuster implements PayoutAllocationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PayoutAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPayoutAllocationAdjuster implements PayoutAllocationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PayoutAllocationUpdatedAtOffsetAdjuster implements PayoutAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: PayoutAllocation, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the payout allocation steps in order and keeps a trace of each. */
export class PayoutAllocationEngine {
  steps: PayoutAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PayoutAllocation): number {
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

  evaluateAll(items: PayoutAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPayoutAllocationEngine(): PayoutAllocationEngine {
  return new PayoutAllocationEngine(
    [
      new TitlePayoutAllocationAdjuster(
        new Map<string, number>([["online", 0.71], ["south", 0.9], ["north", 1.03]]),
      ),
      new TieredPayoutAllocationAdjuster([667, 5673, 7756], [1.19, 0.82, 1.09]),
      new PayoutAllocationUpdatedAtOffsetAdjuster(1),
    ],
    [],
    0.9,
    59536.2,
  );
}
