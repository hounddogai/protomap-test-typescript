import * as numbers from "../../../../kit/numbers.js";
import { ManualPayoutReservation } from "./manual-payout-reservation.js";

/** One step of the manual payout reservation calculation. */
export interface ManualPayoutReservationAdjuster {
  describe(): string;
  adjust(item: ManualPayoutReservation, value: number): number;
}

export class SegmentManualPayoutReservationAdjuster implements ManualPayoutReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ManualPayoutReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumManualPayoutReservationAdjuster implements ManualPayoutReservationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualPayoutReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapManualPayoutReservationAdjuster implements ManualPayoutReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPayoutReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ManualPayoutReservationMaximumOffsetAdjuster implements ManualPayoutReservationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: ManualPayoutReservation, value: number): number {
    return value + item.maximum * this.weight;
  }
}

/** Runs the manual payout reservation steps in order and keeps a trace of each. */
export class ManualPayoutReservationEngine {
  steps: ManualPayoutReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPayoutReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualPayoutReservation): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: ManualPayoutReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualPayoutReservationEngine(): ManualPayoutReservationEngine {
  return new ManualPayoutReservationEngine(
    [
      new SegmentManualPayoutReservationAdjuster(new Map<string, number>([["retail", 1.39]])),
      new MinimumManualPayoutReservationAdjuster(25.4),
      new CapManualPayoutReservationAdjuster(38762),
      new ManualPayoutReservationMaximumOffsetAdjuster(1.49),
    ],
    [],
    4,
    47435,
  );
}
