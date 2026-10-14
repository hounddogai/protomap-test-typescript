import * as numbers from "../../../../kit/numbers.js";
import { ManualPacingReservation } from "./manual-pacing-reservation.js";

/** One step of the manual pacing reservation calculation. */
export interface ManualPacingReservationAdjuster {
  describe(): string;
  adjust(item: ManualPacingReservation, value: number): number;
}

export class CapManualPacingReservationAdjuster implements ManualPacingReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPacingReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredManualPacingReservationAdjuster implements ManualPacingReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualPacingReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceManualPacingReservationAdjuster implements ManualPacingReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ManualPacingReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual pacing reservation steps in order and keeps a trace of each. */
export class ManualPacingReservationEngine {
  steps: ManualPacingReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPacingReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualPacingReservation): number {
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

  evaluateAll(items: ManualPacingReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualPacingReservationEngine(): ManualPacingReservationEngine {
  return new ManualPacingReservationEngine(
    [
      new CapManualPacingReservationAdjuster(16645),
      new TieredManualPacingReservationAdjuster([1307, 3730, 6701], [0.88, 0.96, 0.98]),
      new SourceManualPacingReservationAdjuster(new Map<string, number>([["central", 0.79], ["online", 1.14]])),
    ],
    [],
    1.4,
    34021.9,
  );
}
