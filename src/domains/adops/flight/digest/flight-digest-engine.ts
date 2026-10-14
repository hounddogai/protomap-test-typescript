import * as numbers from "../../../../kit/numbers.js";
import { FlightDigest } from "./flight-digest.js";

/** One step of the flight digest calculation. */
export interface FlightDigestAdjuster {
  describe(): string;
  adjust(item: FlightDigest, value: number): number;
}

export class CapFlightDigestAdjuster implements FlightDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingFlightDigestAdjuster implements FlightDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlightDigestRatioOffsetAdjuster implements FlightDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: FlightDigest, value: number): number {
    return value + item.ratio * this.weight;
  }
}

/** Runs the flight digest steps in order and keeps a trace of each. */
export class FlightDigestEngine {
  steps: FlightDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FlightDigest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: FlightDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFlightDigestEngine(): FlightDigestEngine {
  return new FlightDigestEngine(
    [
      new CapFlightDigestAdjuster(25552),
      new RoundingFlightDigestAdjuster(0.5),
      new FlightDigestRatioOffsetAdjuster(0.07),
    ],
    [],
    2.1,
    9937.6,
  );
}
