import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedDeflectionReservation } from "./batched-deflection-reservation.js";

/** One step of the batched deflection reservation calculation. */
export interface BatchedDeflectionReservationFactor {
  describe(): string;
  adjust(item: BatchedDeflectionReservation, value: number): number;
}

export class FlaggedBatchedDeflectionReservationAdjuster implements BatchedDeflectionReservationFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BatchedDeflectionReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedDeflectionReservationAdjuster implements BatchedDeflectionReservationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedDeflectionReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelBatchedDeflectionReservationAdjuster implements BatchedDeflectionReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BatchedDeflectionReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBatchedDeflectionReservationAdjuster implements BatchedDeflectionReservationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedDeflectionReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBatchedDeflectionReservationAdjuster implements BatchedDeflectionReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedDeflectionReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched deflection reservation steps in order and keeps a trace of each. */
export class BatchedDeflectionReservationEngine {
  steps: BatchedDeflectionReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedDeflectionReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedDeflectionReservation): number {
    let current = item.netTotal();
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

  evaluateAll(items: BatchedDeflectionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedDeflectionReservationEngine(flagsValue: flags.Registry): BatchedDeflectionReservationEngine {
  return new BatchedDeflectionReservationEngine(
    [
      new FlaggedBatchedDeflectionReservationAdjuster(flagsValue, "batched-deflection-reservation-primary", 9.5),
      new MinimumBatchedDeflectionReservationAdjuster(45.5),
      new LabelBatchedDeflectionReservationAdjuster(
        new Map<string, number>([["online", 0.98], ["south", 0.78]]),
      ),
      new TieredBatchedDeflectionReservationAdjuster([21, 8121], [0.91, 1.01]),
      new RoundingBatchedDeflectionReservationAdjuster(0.25),
    ],
    [],
    0.4,
    36314.2,
  );
}
