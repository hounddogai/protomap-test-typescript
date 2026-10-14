import { WaitBatch } from "./wait-batch.js";

/** One step of the wait batch calculation. */
export interface WaitBatchAdjuster {
  describe(): string;
  adjust(item: WaitBatch, value: number): number;
}

export class CategoryWaitBatchAdjuster implements WaitBatchAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: WaitBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWaitBatchAdjuster implements WaitBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWaitBatchAdjuster implements WaitBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWaitBatchAdjuster implements WaitBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class WaitBatchBatchSizeOffsetAdjuster implements WaitBatchAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: WaitBatch, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the wait batch steps in order and keeps a trace of each. */
export class WaitBatchEngine {
  steps: WaitBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WaitBatch): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: WaitBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWaitBatchEngine(): WaitBatchEngine {
  return new WaitBatchEngine(
    [
      new CategoryWaitBatchAdjuster(new Map<string, number>([["east", 1.38]])),
      new TieredWaitBatchAdjuster([418, 2875, 5973], [1.02, 1.08, 0.91]),
      new PercentWaitBatchAdjuster(-13.2),
      new CapWaitBatchAdjuster(38123),
      new WaitBatchBatchSizeOffsetAdjuster(1.23),
    ],
    [],
    1.9,
    90145.7,
  );
}
