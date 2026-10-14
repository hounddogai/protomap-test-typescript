import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FlightMetric } from "./flight-metric.js";

/** One step of the flight metric calculation. */
export interface FlightMetricFactor {
  describe(): string;
  adjust(item: FlightMetric, value: number): number;
}

export class FlightMetricAttemptsOffsetAdjuster implements FlightMetricFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: FlightMetric, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class CapFlightMetricAdjuster implements FlightMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFlightMetricAdjuster implements FlightMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFlightMetricAdjuster implements FlightMetricFactor {
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

  adjust(item: FlightMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameFlightMetricAdjuster implements FlightMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FlightMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFlightMetricAdjuster implements FlightMetricFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the flight metric steps in order and keeps a trace of each. */
export class FlightMetricEngine {
  steps: FlightMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FlightMetric): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FlightMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFlightMetricEngine(flagsValue: flags.Registry): FlightMetricEngine {
  return new FlightMetricEngine(
    [
      new FlightMetricAttemptsOffsetAdjuster(0.34),
      new CapFlightMetricAdjuster(23973),
      new MinimumFlightMetricAdjuster(12.2),
      new FlaggedFlightMetricAdjuster(flagsValue, "flight-metric-seasonal", 2.5),
      new NameFlightMetricAdjuster(new Map<string, number>([["east", 1.32], ["south", 1.11]])),
      new TieredFlightMetricAdjuster([2161, 5679, 6949, 9293], [1.12, 0.83, 1.07, 1.09]),
    ],
    [],
    2.4,
    13146.1,
  );
}
