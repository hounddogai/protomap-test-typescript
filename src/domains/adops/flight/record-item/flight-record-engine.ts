import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FlightRecord } from "./flight-record.js";

/** One step of the flight record calculation. */
export interface FlightRecordAdjuster {
  describe(): string;
  adjust(item: FlightRecord, value: number): number;
}

export class LocaleFlightRecordAdjuster implements FlightRecordAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FlightRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFlightRecordAdjuster implements FlightRecordAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlightRecordCostOffsetAdjuster implements FlightRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: FlightRecord, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class FlaggedFlightRecordAdjuster implements FlightRecordAdjuster {
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

  adjust(item: FlightRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the flight record steps in order and keeps a trace of each. */
export class FlightRecordEngine {
  steps: FlightRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FlightRecord): number {
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

  evaluateAll(items: FlightRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFlightRecordEngine(flagsValue: flags.Registry): FlightRecordEngine {
  return new FlightRecordEngine(
    [
      new LocaleFlightRecordAdjuster(new Map<string, number>([["east", 0.75], ["south", 0.82]])),
      new TieredFlightRecordAdjuster([4467, 5404], [1.08, 1]),
      new FlightRecordCostOffsetAdjuster(1.98),
      new FlaggedFlightRecordAdjuster(flagsValue, "flight-record-manual", 9.9),
    ],
    [],
    1.3,
    60136.5,
  );
}
