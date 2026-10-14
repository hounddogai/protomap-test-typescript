import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FlightVariance } from "./flight-variance.js";

/** One step of the flight variance calculation. */
export interface FlightVarianceStep {
  describe(): string;
  adjust(item: FlightVariance, value: number): number;
}

export class RoundingFlightVarianceAdjuster implements FlightVarianceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedFlightVarianceAdjuster implements FlightVarianceStep {
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

  adjust(item: FlightVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FlightVariancePriorityOffsetAdjuster implements FlightVarianceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: FlightVariance, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the flight variance steps in order and keeps a trace of each. */
export class FlightVarianceEngine {
  steps: FlightVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FlightVariance): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: FlightVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFlightVarianceEngine(flagsValue: flags.Registry): FlightVarianceEngine {
  return new FlightVarianceEngine(
    [
      new RoundingFlightVarianceAdjuster(0.05),
      new FlaggedFlightVarianceAdjuster(flagsValue, "flight-variance-manual", 6),
      new FlightVariancePriorityOffsetAdjuster(1.26),
    ],
    [],
    2.2,
    86677.5,
  );
}
