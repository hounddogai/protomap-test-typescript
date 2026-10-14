import { BatchedPlacementEntry } from "./batched-placement-entry.js";

/** One step of the batched placement entry calculation. */
export interface BatchedPlacementEntryAdjuster {
  describe(): string;
  adjust(item: BatchedPlacementEntry, value: number): number;
}

export class TieredBatchedPlacementEntryAdjuster implements BatchedPlacementEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedPlacementEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CountryBatchedPlacementEntryAdjuster implements BatchedPlacementEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BatchedPlacementEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BatchedPlacementEntryRevisionOffsetAdjuster implements BatchedPlacementEntryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: BatchedPlacementEntry, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class CapBatchedPlacementEntryAdjuster implements BatchedPlacementEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPlacementEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched placement entry steps in order and keeps a trace of each. */
export class BatchedPlacementEntryEngine {
  steps: BatchedPlacementEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPlacementEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedPlacementEntry): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: BatchedPlacementEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedPlacementEntryEngine(): BatchedPlacementEntryEngine {
  return new BatchedPlacementEntryEngine(
    [
      new TieredBatchedPlacementEntryAdjuster([1337, 3858, 5962, 9199], [0.93, 0.91, 0.84, 1.19]),
      new CountryBatchedPlacementEntryAdjuster(
        new Map<string, number>([["retail", 1.08], ["central", 1.34], ["online", 1.13]]),
      ),
      new BatchedPlacementEntryRevisionOffsetAdjuster(1.92),
      new CapBatchedPlacementEntryAdjuster(2162),
    ],
    [],
    0.4,
    91484.6,
  );
}
