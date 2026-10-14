import * as numbers from "../../../../kit/numbers.js";
import { PendingStreakCheckpoint } from "./pending-streak-checkpoint.js";

/** One step of the pending streak checkpoint calculation. */
export interface PendingStreakCheckpointFactor {
  describe(): string;
  adjust(item: PendingStreakCheckpoint, value: number): number;
}

export class PercentPendingStreakCheckpointAdjuster implements PendingStreakCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingStreakCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingStreakCheckpointAdjuster implements PendingStreakCheckpointFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingStreakCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPendingStreakCheckpointAdjuster implements PendingStreakCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingStreakCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPendingStreakCheckpointAdjuster implements PendingStreakCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingStreakCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending streak checkpoint steps in order and keeps a trace of each. */
export class PendingStreakCheckpointEngine {
  steps: PendingStreakCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingStreakCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingStreakCheckpoint): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: PendingStreakCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingStreakCheckpointEngine(): PendingStreakCheckpointEngine {
  return new PendingStreakCheckpointEngine(
    [
      new PercentPendingStreakCheckpointAdjuster(22.9),
      new MinimumPendingStreakCheckpointAdjuster(25.6),
      new TieredPendingStreakCheckpointAdjuster([1777, 4353], [0.83, 0.98]),
      new RoundingPendingStreakCheckpointAdjuster(0.1),
    ],
    [],
    1.5,
    39666,
  );
}
