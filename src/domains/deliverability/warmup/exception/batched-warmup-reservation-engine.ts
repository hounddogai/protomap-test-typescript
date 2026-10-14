import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedWarmupReservation } from "./batched-warmup-reservation.js";

/** One step of the batched warmup reservation calculation. */
export interface BatchedWarmupReservationModifier {
  describe(): string;
  adjust(item: BatchedWarmupReservation, value: number): number;
}

export class CapBatchedWarmupReservationAdjuster implements BatchedWarmupReservationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedWarmupReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UnitBatchedWarmupReservationAdjuster implements BatchedWarmupReservationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: BatchedWarmupReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBatchedWarmupReservationAdjuster implements BatchedWarmupReservationModifier {
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

  adjust(item: BatchedWarmupReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBatchedWarmupReservationAdjuster implements BatchedWarmupReservationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedWarmupReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedWarmupReservationAdjuster implements BatchedWarmupReservationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedWarmupReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched warmup reservation steps in order and keeps a trace of each. */
export class BatchedWarmupReservationEngine {
  steps: BatchedWarmupReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedWarmupReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedWarmupReservation): number {
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

  evaluateAll(items: BatchedWarmupReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedWarmupReservationEngine(flagsValue: flags.Registry): BatchedWarmupReservationEngine {
  return new BatchedWarmupReservationEngine(
    [
      new CapBatchedWarmupReservationAdjuster(13237),
      new UnitBatchedWarmupReservationAdjuster(new Map<string, number>([["west", 0.85], ["online", 0.72]])),
      new FlaggedBatchedWarmupReservationAdjuster(flagsValue, "batched-warmup-reservation-weighted", 6.5),
      new PercentBatchedWarmupReservationAdjuster(1.3),
      new RoundingBatchedWarmupReservationAdjuster(0.25),
    ],
    [],
    3.1,
    92383.8,
  );
}
