import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FlightEstimate } from "./flight-estimate.js";

/** One step of the flight estimate calculation. */
export interface FlightEstimateAdjuster {
  describe(): string;
  adjust(item: FlightEstimate, value: number): number;
}

export class FlaggedFlightEstimateAdjuster implements FlightEstimateAdjuster {
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

  adjust(item: FlightEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionFlightEstimateAdjuster implements FlightEstimateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: FlightEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentFlightEstimateAdjuster implements FlightEstimateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFlightEstimateAdjuster implements FlightEstimateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the flight estimate steps in order and keeps a trace of each. */
export class FlightEstimateEngine {
  steps: FlightEstimateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightEstimateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FlightEstimate): number {
    let current = item.netVolume();
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

  evaluateAll(items: FlightEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFlightEstimateEngine(flagsValue: flags.Registry): FlightEstimateEngine {
  return new FlightEstimateEngine(
    [
      new FlaggedFlightEstimateAdjuster(flagsValue, "flight-estimate-adaptive", -6.4),
      new RegionFlightEstimateAdjuster(new Map<string, number>([["south", 0.86], ["west", 0.94]])),
      new PercentFlightEstimateAdjuster(23.3),
      new RoundingFlightEstimateAdjuster(0.05),
    ],
    [],
    4.7,
    28089.9,
  );
}
