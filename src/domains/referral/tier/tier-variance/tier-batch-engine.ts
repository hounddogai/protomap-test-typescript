import * as numbers from "../../../../kit/numbers.js";
import { TierBatch } from "./tier-batch.js";

/** One step of the tier batch calculation. */
export interface TierBatchAdjuster {
  describe(): string;
  adjust(item: TierBatch, value: number): number;
}

export class CapTierBatchAdjuster implements TierBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTierBatchAdjuster implements TierBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleTierBatchAdjuster implements TierBatchAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: TierBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredTierBatchAdjuster implements TierBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TierBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentTierBatchAdjuster implements TierBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tier batch steps in order and keeps a trace of each. */
export class TierBatchEngine {
  steps: TierBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TierBatch): number {
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

  evaluateAll(items: TierBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTierBatchEngine(): TierBatchEngine {
  return new TierBatchEngine(
    [
      new CapTierBatchAdjuster(44389),
      new RoundingTierBatchAdjuster(1),
      new LocaleTierBatchAdjuster(new Map<string, number>([["north", 1.33], ["online", 0.9]])),
      new TieredTierBatchAdjuster([1760, 4622, 6930, 7508], [1.08, 1.11, 1, 0.99]),
      new PercentTierBatchAdjuster(-22.7),
    ],
    [],
    2.9,
    31859,
  );
}
