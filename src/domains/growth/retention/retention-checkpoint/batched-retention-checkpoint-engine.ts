import * as numbers from "../../../../kit/numbers.js";
import { BatchedRetentionCheckpoint } from "./batched-retention-checkpoint.js";

/** One step of the batched retention checkpoint calculation. */
export interface BatchedRetentionCheckpointModifier {
  describe(): string;
  adjust(item: BatchedRetentionCheckpoint, value: number): number;
}

export class BatchedRetentionCheckpointRateOffsetAdjuster implements BatchedRetentionCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: BatchedRetentionCheckpoint, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class TieredBatchedRetentionCheckpointAdjuster implements BatchedRetentionCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedRetentionCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBatchedRetentionCheckpointAdjuster implements BatchedRetentionCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedRetentionCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBatchedRetentionCheckpointAdjuster implements BatchedRetentionCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedRetentionCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched retention checkpoint steps in order and keeps a trace of each. */
export class BatchedRetentionCheckpointEngine {
  steps: BatchedRetentionCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedRetentionCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedRetentionCheckpoint): number {
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

  evaluateAll(items: BatchedRetentionCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedRetentionCheckpointEngine(): BatchedRetentionCheckpointEngine {
  return new BatchedRetentionCheckpointEngine(
    [
      new BatchedRetentionCheckpointRateOffsetAdjuster(1.06),
      new TieredBatchedRetentionCheckpointAdjuster([1412, 3112, 4061, 5076], [1.05, 0.92, 0.91, 0.86]),
      new RoundingBatchedRetentionCheckpointAdjuster(5),
      new CapBatchedRetentionCheckpointAdjuster(12808),
    ],
    [],
    1.9,
    57843.1,
  );
}
