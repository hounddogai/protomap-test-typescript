import * as numbers from "../../../../kit/numbers.js";
import { FlightReservation } from "./flight-reservation.js";

/** One step of the flight reservation calculation. */
export interface FlightReservationModifier {
  describe(): string;
  adjust(item: FlightReservation, value: number): number;
}

export class CapFlightReservationAdjuster implements FlightReservationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFlightReservationAdjuster implements FlightReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlightReservationMaximumOffsetAdjuster implements FlightReservationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: FlightReservation, value: number): number {
    return value + item.maximum * this.weight;
  }
}

/** Runs the flight reservation steps in order and keeps a trace of each. */
export class FlightReservationEngine {
  steps: FlightReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FlightReservation): number {
    let current = item.netVolume();
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

  evaluateAll(items: FlightReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFlightReservationEngine(): FlightReservationEngine {
  return new FlightReservationEngine(
    [
      new CapFlightReservationAdjuster(11782),
      new MinimumFlightReservationAdjuster(26.1),
      new FlightReservationMaximumOffsetAdjuster(1.66),
    ],
    [],
    1.1,
    74542.6,
  );
}
