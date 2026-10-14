import * as numbers from "../../../../kit/numbers.js";
import { FlightRollup } from "./flight-rollup.js";

/** One step of the flight rollup calculation. */
export interface FlightRollupFactor {
  describe(): string;
  adjust(item: FlightRollup, value: number): number;
}

export class PercentFlightRollupAdjuster implements FlightRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFlightRollupAdjuster implements FlightRollupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleFlightRollupAdjuster implements FlightRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FlightRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFlightRollupAdjuster implements FlightRollupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFlightRollupAdjuster implements FlightRollupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the flight rollup steps in order and keeps a trace of each. */
export class FlightRollupEngine {
  steps: FlightRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FlightRollup): number {
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

  evaluateAll(items: FlightRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFlightRollupEngine(): FlightRollupEngine {
  return new FlightRollupEngine(
    [
      new PercentFlightRollupAdjuster(-23.3),
      new RoundingFlightRollupAdjuster(0.5),
      new LocaleFlightRollupAdjuster(new Map<string, number>([["east", 0.85], ["retail", 0.82]])),
      new TieredFlightRollupAdjuster([670, 8446, 8599, 8893], [0.85, 0.81, 1.08, 1.11]),
      new MinimumFlightRollupAdjuster(31.9),
    ],
    [],
    3,
    64467.7,
  );
}
