import * as numbers from "../../../../kit/numbers.js";
import { FlightProfile } from "./flight-profile.js";

/** One step of the flight profile calculation. */
export interface FlightProfileModifier {
  describe(): string;
  adjust(item: FlightProfile, value: number): number;
}

export class RegionFlightProfileAdjuster implements FlightProfileModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: FlightProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFlightProfileAdjuster implements FlightProfileModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFlightProfileAdjuster implements FlightProfileModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlightProfilePriorityOffsetAdjuster implements FlightProfileModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: FlightProfile, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the flight profile steps in order and keeps a trace of each. */
export class FlightProfileEngine {
  steps: FlightProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FlightProfile): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: FlightProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFlightProfileEngine(): FlightProfileEngine {
  return new FlightProfileEngine(
    [
      new RegionFlightProfileAdjuster(new Map<string, number>([["central", 1.2]])),
      new MinimumFlightProfileAdjuster(47.3),
      new TieredFlightProfileAdjuster([2290, 5897, 6052, 7565], [1.12, 0.98, 1.12, 0.98]),
      new FlightProfilePriorityOffsetAdjuster(1.48),
    ],
    [],
    2.6,
    71561.7,
  );
}
