import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInReservation } from "./double-opt-in-reservation.js";

/** One step of the double opt in reservation calculation. */
export interface DoubleOptInReservationModifier {
  describe(): string;
  adjust(item: DoubleOptInReservation, value: number): number;
}

export class CapDoubleOptInReservationAdjuster implements DoubleOptInReservationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDoubleOptInReservationAdjuster implements DoubleOptInReservationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDoubleOptInReservationAdjuster implements DoubleOptInReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the double opt in reservation steps in order and keeps a trace of each. */
export class DoubleOptInReservationEngine {
  steps: DoubleOptInReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DoubleOptInReservation): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: DoubleOptInReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDoubleOptInReservationEngine(): DoubleOptInReservationEngine {
  return new DoubleOptInReservationEngine(
    [
      new CapDoubleOptInReservationAdjuster(25489),
      new PercentDoubleOptInReservationAdjuster(-16.7),
      new MinimumDoubleOptInReservationAdjuster(37.1),
    ],
    [],
    3.1,
    39615.5,
  );
}
