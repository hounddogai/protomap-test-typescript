import { BatchedConversionReservation } from "./batched-conversion-reservation.js";

/** One step of the batched conversion reservation calculation. */
export interface BatchedConversionReservationAdjuster {
  describe(): string;
  adjust(item: BatchedConversionReservation, value: number): number;
}

export class MinimumBatchedConversionReservationAdjuster implements BatchedConversionReservationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedConversionReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBatchedConversionReservationAdjuster implements BatchedConversionReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedConversionReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceBatchedConversionReservationAdjuster implements BatchedConversionReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: BatchedConversionReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched conversion reservation steps in order and keeps a trace of each. */
export class BatchedConversionReservationEngine {
  steps: BatchedConversionReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedConversionReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedConversionReservation): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: BatchedConversionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedConversionReservationEngine(): BatchedConversionReservationEngine {
  return new BatchedConversionReservationEngine(
    [
      new MinimumBatchedConversionReservationAdjuster(22.6),
      new CapBatchedConversionReservationAdjuster(1572),
      new UtmSourceBatchedConversionReservationAdjuster(new Map<string, number>([["north", 0.93]])),
    ],
    [],
    4.2,
    82654,
  );
}
