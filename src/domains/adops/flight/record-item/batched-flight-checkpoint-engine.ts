import * as numbers from "../../../../kit/numbers.js";
import { BatchedFlightCheckpoint } from "./batched-flight-checkpoint.js";

/** One step of the batched flight checkpoint calculation. */
export interface BatchedFlightCheckpointFactor {
  describe(): string;
  adjust(item: BatchedFlightCheckpoint, value: number): number;
}

export class MinimumBatchedFlightCheckpointAdjuster implements BatchedFlightCheckpointFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedFlightCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedFlightCheckpointAdjuster implements BatchedFlightCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedFlightCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedFlightCheckpointAdjuster implements BatchedFlightCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedFlightCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBatchedFlightCheckpointAdjuster implements BatchedFlightCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedFlightCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched flight checkpoint steps in order and keeps a trace of each. */
export class BatchedFlightCheckpointEngine {
  steps: BatchedFlightCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedFlightCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedFlightCheckpoint): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: BatchedFlightCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedFlightCheckpointEngine(): BatchedFlightCheckpointEngine {
  return new BatchedFlightCheckpointEngine(
    [
      new MinimumBatchedFlightCheckpointAdjuster(0.8),
      new PercentBatchedFlightCheckpointAdjuster(13.9),
      new RoundingBatchedFlightCheckpointAdjuster(1),
      new CapBatchedFlightCheckpointAdjuster(35706),
    ],
    [],
    4.6,
    55299.7,
  );
}
