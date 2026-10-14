import * as numbers from "../../../../kit/numbers.js";
import { FlightAssignment } from "./flight-assignment.js";

/** One step of the flight assignment calculation. */
export interface FlightAssignmentFactor {
  describe(): string;
  adjust(item: FlightAssignment, value: number): number;
}

export class TieredFlightAssignmentAdjuster implements FlightAssignmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFlightAssignmentAdjuster implements FlightAssignmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlightAssignmentCostOffsetAdjuster implements FlightAssignmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: FlightAssignment, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class MinimumFlightAssignmentAdjuster implements FlightAssignmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFlightAssignmentAdjuster implements FlightAssignmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleFlightAssignmentAdjuster implements FlightAssignmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: FlightAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the flight assignment steps in order and keeps a trace of each. */
export class FlightAssignmentEngine {
  steps: FlightAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FlightAssignment): number {
    let current = item.weightedValue();
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

  evaluateAll(items: FlightAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFlightAssignmentEngine(): FlightAssignmentEngine {
  return new FlightAssignmentEngine(
    [
      new TieredFlightAssignmentAdjuster([1622, 2309, 7078], [1.01, 0.86, 0.92]),
      new CapFlightAssignmentAdjuster(32558),
      new FlightAssignmentCostOffsetAdjuster(1.91),
      new MinimumFlightAssignmentAdjuster(0.8),
      new RoundingFlightAssignmentAdjuster(1),
      new TitleFlightAssignmentAdjuster(new Map<string, number>([["west", 1.24]])),
    ],
    [],
    2.7,
    80404.3,
  );
}
