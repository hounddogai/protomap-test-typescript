import * as numbers from "../../../../kit/numbers.js";
import { BatchedInviteEntry } from "./batched-invite-entry.js";

/** One step of the batched invite entry calculation. */
export interface BatchedInviteEntryFactor {
  describe(): string;
  adjust(item: BatchedInviteEntry, value: number): number;
}

export class TieredBatchedInviteEntryAdjuster implements BatchedInviteEntryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedInviteEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBatchedInviteEntryAdjuster implements BatchedInviteEntryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedInviteEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBatchedInviteEntryAdjuster implements BatchedInviteEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedInviteEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedInviteEntryAdjuster implements BatchedInviteEntryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedInviteEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched invite entry steps in order and keeps a trace of each. */
export class BatchedInviteEntryEngine {
  steps: BatchedInviteEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedInviteEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedInviteEntry): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: BatchedInviteEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedInviteEntryEngine(): BatchedInviteEntryEngine {
  return new BatchedInviteEntryEngine(
    [
      new TieredBatchedInviteEntryAdjuster([8148, 8246], [0.94, 1.19]),
      new RoundingBatchedInviteEntryAdjuster(0.25),
      new MinimumBatchedInviteEntryAdjuster(2.6),
      new PercentBatchedInviteEntryAdjuster(12.1),
    ],
    [],
    1.3,
    26954.3,
  );
}
