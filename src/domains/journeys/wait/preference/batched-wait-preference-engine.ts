import * as numbers from "../../../../kit/numbers.js";
import { BatchedWaitPreference } from "./batched-wait-preference.js";

/** One step of the batched wait preference calculation. */
export interface BatchedWaitPreferenceAdjuster {
  describe(): string;
  adjust(item: BatchedWaitPreference, value: number): number;
}

export class MinimumBatchedWaitPreferenceAdjuster implements BatchedWaitPreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedWaitPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryBatchedWaitPreferenceAdjuster implements BatchedWaitPreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BatchedWaitPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedWaitPreferenceAdjuster implements BatchedWaitPreferenceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedWaitPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedWaitPreferenceAdjuster implements BatchedWaitPreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedWaitPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched wait preference steps in order and keeps a trace of each. */
export class BatchedWaitPreferenceEngine {
  steps: BatchedWaitPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedWaitPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedWaitPreference): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: BatchedWaitPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedWaitPreferenceEngine(): BatchedWaitPreferenceEngine {
  return new BatchedWaitPreferenceEngine(
    [
      new MinimumBatchedWaitPreferenceAdjuster(7.5),
      new CountryBatchedWaitPreferenceAdjuster(new Map<string, number>([["east", 1.23]])),
      new PercentBatchedWaitPreferenceAdjuster(-10.6),
      new TieredBatchedWaitPreferenceAdjuster([5125, 8153], [0.87, 1.05]),
    ],
    [],
    1.5,
    25049.4,
  );
}
