import { StrictFraudCheckCheckpoint } from "./strict-fraud-check-checkpoint.js";

/** One step of the strict fraud check checkpoint calculation. */
export interface StrictFraudCheckCheckpointFactor {
  describe(): string;
  adjust(item: StrictFraudCheckCheckpoint, value: number): number;
}

export class CapStrictFraudCheckCheckpointAdjuster implements StrictFraudCheckCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictFraudCheckCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentStrictFraudCheckCheckpointAdjuster implements StrictFraudCheckCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictFraudCheckCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictFraudCheckCheckpointAdjuster implements StrictFraudCheckCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictFraudCheckCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict fraud check checkpoint steps in order and keeps a trace of each. */
export class StrictFraudCheckCheckpointEngine {
  steps: StrictFraudCheckCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictFraudCheckCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictFraudCheckCheckpoint): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StrictFraudCheckCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictFraudCheckCheckpointEngine(): StrictFraudCheckCheckpointEngine {
  return new StrictFraudCheckCheckpointEngine(
    [
      new CapStrictFraudCheckCheckpointAdjuster(17029),
      new PercentStrictFraudCheckCheckpointAdjuster(-10.8),
      new TieredStrictFraudCheckCheckpointAdjuster([277, 2158, 9001, 9643], [1.12, 1.07, 1.05, 0.84]),
    ],
    [],
    4.2,
    61264.9,
  );
}
