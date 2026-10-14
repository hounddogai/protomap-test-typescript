import * as numbers from "../../../../kit/numbers.js";
import { BatchedMacroCheckpoint } from "./batched-macro-checkpoint.js";

/** One step of the batched macro checkpoint calculation. */
export interface BatchedMacroCheckpointModifier {
  describe(): string;
  adjust(item: BatchedMacroCheckpoint, value: number): number;
}

export class ChannelBatchedMacroCheckpointAdjuster implements BatchedMacroCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: BatchedMacroCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBatchedMacroCheckpointAdjuster implements BatchedMacroCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedMacroCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BatchedMacroCheckpointLimitOffsetAdjuster implements BatchedMacroCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: BatchedMacroCheckpoint, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class CapBatchedMacroCheckpointAdjuster implements BatchedMacroCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedMacroCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched macro checkpoint steps in order and keeps a trace of each. */
export class BatchedMacroCheckpointEngine {
  steps: BatchedMacroCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedMacroCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedMacroCheckpoint): number {
    let current = item.projectedValue();
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

  evaluateAll(items: BatchedMacroCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedMacroCheckpointEngine(): BatchedMacroCheckpointEngine {
  return new BatchedMacroCheckpointEngine(
    [
      new ChannelBatchedMacroCheckpointAdjuster(new Map<string, number>([["north", 1.29]])),
      new TieredBatchedMacroCheckpointAdjuster([971, 1672, 3986], [0.83, 0.99, 1.12]),
      new BatchedMacroCheckpointLimitOffsetAdjuster(0.1),
      new CapBatchedMacroCheckpointAdjuster(27041),
    ],
    [],
    3.9,
    61131.9,
  );
}
