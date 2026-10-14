import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FlightEntry } from "./flight-entry.js";

/** One step of the flight entry calculation. */
export interface FlightEntryFactor {
  describe(): string;
  adjust(item: FlightEntry, value: number): number;
}

export class PercentFlightEntryAdjuster implements FlightEntryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredFlightEntryAdjuster implements FlightEntryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFlightEntryAdjuster implements FlightEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelFlightEntryAdjuster implements FlightEntryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FlightEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFlightEntryAdjuster implements FlightEntryFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: FlightEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the flight entry steps in order and keeps a trace of each. */
export class FlightEntryEngine {
  steps: FlightEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FlightEntry): number {
    let current = item.netValue();
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

  evaluateAll(items: FlightEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFlightEntryEngine(flagsValue: flags.Registry): FlightEntryEngine {
  return new FlightEntryEngine(
    [
      new PercentFlightEntryAdjuster(8),
      new TieredFlightEntryAdjuster([3257, 4426, 5691], [1.19, 1, 1.15]),
      new MinimumFlightEntryAdjuster(24),
      new LabelFlightEntryAdjuster(new Map<string, number>([["north", 1.15]])),
      new FlaggedFlightEntryAdjuster(flagsValue, "flight-entry-scheduled", -4.7),
    ],
    [],
    1.9,
    79834,
  );
}
