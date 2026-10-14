import * as numbers from "../../../../kit/numbers.js";
import { DeflectionReservation } from "./deflection-reservation.js";

/** One step of the deflection reservation calculation. */
export interface DeflectionReservationModifier {
  describe(): string;
  adjust(item: DeflectionReservation, value: number): number;
}

export class MinimumDeflectionReservationAdjuster implements DeflectionReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentDeflectionReservationAdjuster implements DeflectionReservationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDeflectionReservationAdjuster implements DeflectionReservationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the deflection reservation steps in order and keeps a trace of each. */
export class DeflectionReservationEngine {
  steps: DeflectionReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DeflectionReservation): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: DeflectionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDeflectionReservationEngine(): DeflectionReservationEngine {
  return new DeflectionReservationEngine(
    [
      new MinimumDeflectionReservationAdjuster(15.8),
      new PercentDeflectionReservationAdjuster(2.9),
      new RoundingDeflectionReservationAdjuster(0.25),
    ],
    [],
    1,
    69262.5,
  );
}
