import * as numbers from "../../../../kit/numbers.js";
import { FlightLedger } from "./flight-ledger.js";

/** One step of the flight ledger calculation. */
export interface FlightLedgerStep {
  describe(): string;
  adjust(item: FlightLedger, value: number): number;
}

export class MinimumFlightLedgerAdjuster implements FlightLedgerStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFlightLedgerAdjuster implements FlightLedgerStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFlightLedgerAdjuster implements FlightLedgerStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlightLedgerLimitOffsetAdjuster implements FlightLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: FlightLedger, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class CapFlightLedgerAdjuster implements FlightLedgerStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFlightLedgerAdjuster implements FlightLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the flight ledger steps in order and keeps a trace of each. */
export class FlightLedgerEngine {
  steps: FlightLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FlightLedger): number {
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

  evaluateAll(items: FlightLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFlightLedgerEngine(): FlightLedgerEngine {
  return new FlightLedgerEngine(
    [
      new MinimumFlightLedgerAdjuster(36.1),
      new RoundingFlightLedgerAdjuster(0.1),
      new TieredFlightLedgerAdjuster([2191, 7428], [1.2, 1.1]),
      new FlightLedgerLimitOffsetAdjuster(0.56),
      new CapFlightLedgerAdjuster(13348),
      new PercentFlightLedgerAdjuster(-1.5),
    ],
    [],
    1.3,
    72328.9,
  );
}
