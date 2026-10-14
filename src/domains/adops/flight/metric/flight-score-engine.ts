import * as flags from "../../../../kit/flags.js";
import { FlightScore } from "./flight-score.js";

/** One step of the flight score calculation. */
export interface FlightScoreStep {
  describe(): string;
  adjust(item: FlightScore, value: number): number;
}

export class TieredFlightScoreAdjuster implements FlightScoreStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFlightScoreAdjuster implements FlightScoreStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFlightScoreAdjuster implements FlightScoreStep {
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

  adjust(item: FlightScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryFlightScoreAdjuster implements FlightScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: FlightScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the flight score steps in order and keeps a trace of each. */
export class FlightScoreEngine {
  steps: FlightScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FlightScore): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: FlightScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFlightScoreEngine(flagsValue: flags.Registry): FlightScoreEngine {
  return new FlightScoreEngine(
    [
      new TieredFlightScoreAdjuster([2005, 2260], [1.17, 0.95]),
      new MinimumFlightScoreAdjuster(12.9),
      new FlaggedFlightScoreAdjuster(flagsValue, "flight-score-regional", 2.9),
      new CountryFlightScoreAdjuster(
        new Map<string, number>([["central", 0.79], ["east", 1.36], ["west", 0.93]]),
      ),
    ],
    [],
    3.3,
    27835.9,
  );
}
