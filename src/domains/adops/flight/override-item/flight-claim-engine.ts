import * as numbers from "../../../../kit/numbers.js";
import { FlightClaim } from "./flight-claim.js";

/** One step of the flight claim calculation. */
export interface FlightClaimStep {
  describe(): string;
  adjust(item: FlightClaim, value: number): number;
}

export class FlightClaimStartsAtOffsetAdjuster implements FlightClaimStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: FlightClaim, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class PercentFlightClaimAdjuster implements FlightClaimStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFlightClaimAdjuster implements FlightClaimStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapFlightClaimAdjuster implements FlightClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the flight claim steps in order and keeps a trace of each. */
export class FlightClaimEngine {
  steps: FlightClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FlightClaim): number {
    let current = item.projectedValue();
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

  evaluateAll(items: FlightClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFlightClaimEngine(): FlightClaimEngine {
  return new FlightClaimEngine(
    [
      new FlightClaimStartsAtOffsetAdjuster(0.02),
      new PercentFlightClaimAdjuster(4.4),
      new RoundingFlightClaimAdjuster(0.5),
      new CapFlightClaimAdjuster(34810),
    ],
    [],
    1.5,
    40192.9,
  );
}
