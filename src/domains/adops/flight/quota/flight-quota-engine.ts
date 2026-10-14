import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FlightQuota } from "./flight-quota.js";

/** One step of the flight quota calculation. */
export interface FlightQuotaModifier {
  describe(): string;
  adjust(item: FlightQuota, value: number): number;
}

export class TieredFlightQuotaAdjuster implements FlightQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentFlightQuotaAdjuster implements FlightQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFlightQuotaAdjuster implements FlightQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlightQuotaSendAtOffsetAdjuster implements FlightQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: FlightQuota, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class FlaggedFlightQuotaAdjuster implements FlightQuotaModifier {
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

  adjust(item: FlightQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFlightQuotaAdjuster implements FlightQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the flight quota steps in order and keeps a trace of each. */
export class FlightQuotaEngine {
  steps: FlightQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FlightQuota): number {
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

  evaluateAll(items: FlightQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFlightQuotaEngine(flagsValue: flags.Registry): FlightQuotaEngine {
  return new FlightQuotaEngine(
    [
      new TieredFlightQuotaAdjuster([881, 1900, 6497], [0.91, 1.19, 1.05]),
      new PercentFlightQuotaAdjuster(2),
      new MinimumFlightQuotaAdjuster(24.4),
      new FlightQuotaSendAtOffsetAdjuster(0.79),
      new FlaggedFlightQuotaAdjuster(flagsValue, "flight-quota-manual", 3.3),
      new RoundingFlightQuotaAdjuster(0.5),
    ],
    [],
    3.2,
    48709.1,
  );
}
