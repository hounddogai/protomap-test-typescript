import { BatchedWindowReservation } from "./batched-window-reservation.js";

/** One step of the batched window reservation calculation. */
export interface BatchedWindowReservationStep {
  describe(): string;
  adjust(item: BatchedWindowReservation, value: number): number;
}

export class BatchedWindowReservationQuantityOffsetAdjuster implements BatchedWindowReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: BatchedWindowReservation, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class MinimumBatchedWindowReservationAdjuster implements BatchedWindowReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedWindowReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBatchedWindowReservationAdjuster implements BatchedWindowReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedWindowReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched window reservation steps in order and keeps a trace of each. */
export class BatchedWindowReservationEngine {
  steps: BatchedWindowReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedWindowReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedWindowReservation): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: BatchedWindowReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedWindowReservationEngine(): BatchedWindowReservationEngine {
  return new BatchedWindowReservationEngine(
    [
      new BatchedWindowReservationQuantityOffsetAdjuster(0.79),
      new MinimumBatchedWindowReservationAdjuster(47.9),
      new CapBatchedWindowReservationAdjuster(19257),
    ],
    [],
    2.1,
    36550,
  );
}
