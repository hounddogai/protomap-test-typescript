import * as numbers from "../../../../kit/numbers.js";
import { CreditRollup } from "./credit-rollup.js";

/** One step of the credit rollup calculation. */
export interface CreditRollupFactor {
  describe(): string;
  adjust(item: CreditRollup, value: number): number;
}

export class TieredCreditRollupAdjuster implements CreditRollupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CreditRollupBidOffsetAdjuster implements CreditRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: CreditRollup, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class CapCreditRollupAdjuster implements CreditRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCreditRollupAdjuster implements CreditRollupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the credit rollup steps in order and keeps a trace of each. */
export class CreditRollupEngine {
  steps: CreditRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreditRollup): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: CreditRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreditRollupEngine(): CreditRollupEngine {
  return new CreditRollupEngine(
    [
      new TieredCreditRollupAdjuster([2878, 3269], [0.88, 0.81]),
      new CreditRollupBidOffsetAdjuster(1.58),
      new CapCreditRollupAdjuster(18496),
      new MinimumCreditRollupAdjuster(16.8),
    ],
    [],
    4.3,
    90126.9,
  );
}
