import { TieredWarmupBatch } from "./tiered-warmup-batch.js";

/** One step of the tiered warmup batch calculation. */
export interface TieredWarmupBatchStep {
  describe(): string;
  adjust(item: TieredWarmupBatch, value: number): number;
}

export class TieredTieredWarmupBatchAdjuster implements TieredWarmupBatchStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredWarmupBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TieredWarmupBatchBudgetOffsetAdjuster implements TieredWarmupBatchStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: TieredWarmupBatch, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class UnitTieredWarmupBatchAdjuster implements TieredWarmupBatchStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: TieredWarmupBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered warmup batch steps in order and keeps a trace of each. */
export class TieredWarmupBatchEngine {
  steps: TieredWarmupBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredWarmupBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredWarmupBatch): number {
    let current = item.netValue();
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

  evaluateAll(items: TieredWarmupBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredWarmupBatchEngine(): TieredWarmupBatchEngine {
  return new TieredWarmupBatchEngine(
    [
      new TieredTieredWarmupBatchAdjuster([2005, 9992], [0.81, 0.97]),
      new TieredWarmupBatchBudgetOffsetAdjuster(0.97),
      new UnitTieredWarmupBatchAdjuster(
        new Map<string, number>([["central", 1.27], ["retail", 1.04], ["south", 0.89]]),
      ),
    ],
    [],
    4.9,
    31432,
  );
}
