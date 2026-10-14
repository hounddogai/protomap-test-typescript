import * as numbers from "../../../../kit/numbers.js";
import { BatchedLevelEntry } from "./batched-level-entry.js";

/** One step of the batched level entry calculation. */
export interface BatchedLevelEntryModifier {
  describe(): string;
  adjust(item: BatchedLevelEntry, value: number): number;
}

export class BatchedLevelEntryCreatedAtOffsetAdjuster implements BatchedLevelEntryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: BatchedLevelEntry, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class PercentBatchedLevelEntryAdjuster implements BatchedLevelEntryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedLevelEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedLevelEntryAdjuster implements BatchedLevelEntryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedLevelEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapBatchedLevelEntryAdjuster implements BatchedLevelEntryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedLevelEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched level entry steps in order and keeps a trace of each. */
export class BatchedLevelEntryEngine {
  steps: BatchedLevelEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedLevelEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedLevelEntry): number {
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

  evaluateAll(items: BatchedLevelEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedLevelEntryEngine(): BatchedLevelEntryEngine {
  return new BatchedLevelEntryEngine(
    [
      new BatchedLevelEntryCreatedAtOffsetAdjuster(0.47),
      new PercentBatchedLevelEntryAdjuster(-20.9),
      new TieredBatchedLevelEntryAdjuster([2364, 3914, 6645, 7396], [0.93, 0.99, 1.14, 1.09]),
      new CapBatchedLevelEntryAdjuster(18525),
    ],
    [],
    3.1,
    44838.3,
  );
}
