import * as numbers from "../../../../kit/numbers.js";
import { BatchedWarmupLedger } from "./batched-warmup-ledger.js";

/** One step of the batched warmup ledger calculation. */
export interface BatchedWarmupLedgerAdjuster {
  describe(): string;
  adjust(item: BatchedWarmupLedger, value: number): number;
}

export class TieredBatchedWarmupLedgerAdjuster implements BatchedWarmupLedgerAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedWarmupLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BatchedWarmupLedgerThresholdOffsetAdjuster implements BatchedWarmupLedgerAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: BatchedWarmupLedger, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class TitleBatchedWarmupLedgerAdjuster implements BatchedWarmupLedgerAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedWarmupLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBatchedWarmupLedgerAdjuster implements BatchedWarmupLedgerAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedWarmupLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBatchedWarmupLedgerAdjuster implements BatchedWarmupLedgerAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedWarmupLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched warmup ledger steps in order and keeps a trace of each. */
export class BatchedWarmupLedgerEngine {
  steps: BatchedWarmupLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedWarmupLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedWarmupLedger): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: BatchedWarmupLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedWarmupLedgerEngine(): BatchedWarmupLedgerEngine {
  return new BatchedWarmupLedgerEngine(
    [
      new TieredBatchedWarmupLedgerAdjuster([4481, 5824], [1.13, 0.84]),
      new BatchedWarmupLedgerThresholdOffsetAdjuster(0.61),
      new TitleBatchedWarmupLedgerAdjuster(
        new Map<string, number>([["retail", 1.02], ["east", 0.84], ["south", 1.23]]),
      ),
      new RoundingBatchedWarmupLedgerAdjuster(0.25),
      new CapBatchedWarmupLedgerAdjuster(45629),
    ],
    [],
    1.6,
    10006,
  );
}
