import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FlightException } from "./flight-exception.js";

/** One step of the flight exception calculation. */
export interface FlightExceptionModifier {
  describe(): string;
  adjust(item: FlightException, value: number): number;
}

export class LocaleFlightExceptionAdjuster implements FlightExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FlightException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapFlightExceptionAdjuster implements FlightExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlightExceptionImpressionsOffsetAdjuster implements FlightExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: FlightException, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class RoundingFlightExceptionAdjuster implements FlightExceptionModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFlightExceptionAdjuster implements FlightExceptionModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFlightExceptionAdjuster implements FlightExceptionModifier {
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

  adjust(item: FlightException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the flight exception steps in order and keeps a trace of each. */
export class FlightExceptionEngine {
  steps: FlightExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FlightException): number {
    let current = item.netExposure();
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

  evaluateAll(items: FlightException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFlightExceptionEngine(flagsValue: flags.Registry): FlightExceptionEngine {
  return new FlightExceptionEngine(
    [
      new LocaleFlightExceptionAdjuster(new Map<string, number>([["retail", 1.12]])),
      new CapFlightExceptionAdjuster(49012),
      new FlightExceptionImpressionsOffsetAdjuster(1.16),
      new RoundingFlightExceptionAdjuster(1),
      new TieredFlightExceptionAdjuster([4850, 6294, 6591, 8737], [1.03, 1, 0.86, 0.9]),
      new FlaggedFlightExceptionAdjuster(flagsValue, "flight-exception-legacy", -1.6),
    ],
    [],
    3,
    62109.6,
  );
}
