import * as numbers from "../../../../kit/numbers.js";
import { OptOutReservation } from "./opt-out-reservation.js";

/** One step of the opt out reservation calculation. */
export interface OptOutReservationFactor {
  describe(): string;
  adjust(item: OptOutReservation, value: number): number;
}

export class RegionOptOutReservationAdjuster implements OptOutReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: OptOutReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingOptOutReservationAdjuster implements OptOutReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapOptOutReservationAdjuster implements OptOutReservationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: OptOutReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the opt out reservation steps in order and keeps a trace of each. */
export class OptOutReservationEngine {
  steps: OptOutReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: OptOutReservation): number {
    let current = item.netVolume();
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

  evaluateAll(items: OptOutReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultOptOutReservationEngine(): OptOutReservationEngine {
  return new OptOutReservationEngine(
    [
      new RegionOptOutReservationAdjuster(new Map<string, number>([["west", 1.17]])),
      new RoundingOptOutReservationAdjuster(0.1),
      new CapOptOutReservationAdjuster(34367),
    ],
    [],
    2.2,
    55453.3,
  );
}
