import * as numbers from "../../../../kit/numbers.js";
import { RetentionRollup } from "./retention-rollup.js";

/** One step of the retention rollup calculation. */
export interface RetentionRollupFactor {
  describe(): string;
  adjust(item: RetentionRollup, value: number): number;
}

export class TieredRetentionRollupAdjuster implements RetentionRollupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRetentionRollupAdjuster implements RetentionRollupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameRetentionRollupAdjuster implements RetentionRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RetentionRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the retention rollup steps in order and keeps a trace of each. */
export class RetentionRollupEngine {
  steps: RetentionRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RetentionRollup): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: RetentionRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRetentionRollupEngine(): RetentionRollupEngine {
  return new RetentionRollupEngine(
    [
      new TieredRetentionRollupAdjuster([1758, 4046, 5445, 9715], [0.92, 1.12, 1.17, 0.92]),
      new MinimumRetentionRollupAdjuster(13.2),
      new NameRetentionRollupAdjuster(new Map<string, number>([["south", 1.02]])),
    ],
    [],
    4.1,
    75336.5,
  );
}
