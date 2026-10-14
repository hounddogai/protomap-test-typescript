import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedFraudCheckReservation } from "./batched-fraud-check-reservation.js";

/** One step of the batched fraud check reservation calculation. */
export interface BatchedFraudCheckReservationFactor {
  describe(): string;
  adjust(item: BatchedFraudCheckReservation, value: number): number;
}

export class MinimumBatchedFraudCheckReservationAdjuster implements BatchedFraudCheckReservationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedFraudCheckReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SourceBatchedFraudCheckReservationAdjuster implements BatchedFraudCheckReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BatchedFraudCheckReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BatchedFraudCheckReservationBatchSizeOffsetAdjuster implements BatchedFraudCheckReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: BatchedFraudCheckReservation, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class PercentBatchedFraudCheckReservationAdjuster implements BatchedFraudCheckReservationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedFraudCheckReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBatchedFraudCheckReservationAdjuster implements BatchedFraudCheckReservationFactor {
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

  adjust(item: BatchedFraudCheckReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched fraud check reservation steps in order and keeps a trace of each. */
export class BatchedFraudCheckReservationEngine {
  steps: BatchedFraudCheckReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedFraudCheckReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedFraudCheckReservation): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: BatchedFraudCheckReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedFraudCheckReservationEngine(flagsValue: flags.Registry): BatchedFraudCheckReservationEngine {
  return new BatchedFraudCheckReservationEngine(
    [
      new MinimumBatchedFraudCheckReservationAdjuster(21),
      new SourceBatchedFraudCheckReservationAdjuster(new Map<string, number>([["west", 0.8], ["south", 0.91]])),
      new BatchedFraudCheckReservationBatchSizeOffsetAdjuster(1.13),
      new PercentBatchedFraudCheckReservationAdjuster(3.4),
      new FlaggedBatchedFraudCheckReservationAdjuster(flagsValue, "batched-fraud-check-reservation-global", 4.1),
    ],
    [],
    1,
    92673.3,
  );
}
