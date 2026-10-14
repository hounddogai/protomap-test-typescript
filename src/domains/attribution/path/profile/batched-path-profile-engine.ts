import * as numbers from "../../../../kit/numbers.js";
import { BatchedPathProfile } from "./batched-path-profile.js";

/** One step of the batched path profile calculation. */
export interface BatchedPathProfileFactor {
  describe(): string;
  adjust(item: BatchedPathProfile, value: number): number;
}

export class LabelBatchedPathProfileAdjuster implements BatchedPathProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BatchedPathProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BatchedPathProfileBudgetOffsetAdjuster implements BatchedPathProfileFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: BatchedPathProfile, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingBatchedPathProfileAdjuster implements BatchedPathProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedPathProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBatchedPathProfileAdjuster implements BatchedPathProfileFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedPathProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched path profile steps in order and keeps a trace of each. */
export class BatchedPathProfileEngine {
  steps: BatchedPathProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPathProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedPathProfile): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedPathProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedPathProfileEngine(): BatchedPathProfileEngine {
  return new BatchedPathProfileEngine(
    [
      new LabelBatchedPathProfileAdjuster(new Map<string, number>([["east", 1.29], ["online", 0.93]])),
      new BatchedPathProfileBudgetOffsetAdjuster(1.29),
      new RoundingBatchedPathProfileAdjuster(1),
      new TieredBatchedPathProfileAdjuster([2147, 9433], [1.14, 1.08]),
    ],
    [],
    0.7,
    78544,
  );
}
