import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentForecast } from "./enrollment-forecast.js";

/** One step of the enrollment forecast calculation. */
export interface EnrollmentForecastStep {
  describe(): string;
  adjust(item: EnrollmentForecast, value: number): number;
}

export class RoundingEnrollmentForecastAdjuster implements EnrollmentForecastStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumEnrollmentForecastAdjuster implements EnrollmentForecastStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedEnrollmentForecastAdjuster implements EnrollmentForecastStep {
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

  adjust(item: EnrollmentForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentEnrollmentForecastAdjuster implements EnrollmentForecastStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the enrollment forecast steps in order and keeps a trace of each. */
export class EnrollmentForecastEngine {
  steps: EnrollmentForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: EnrollmentForecast): number {
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

  evaluateAll(items: EnrollmentForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultEnrollmentForecastEngine(flagsValue: flags.Registry): EnrollmentForecastEngine {
  return new EnrollmentForecastEngine(
    [
      new RoundingEnrollmentForecastAdjuster(0.05),
      new MinimumEnrollmentForecastAdjuster(0.3),
      new FlaggedEnrollmentForecastAdjuster(flagsValue, "enrollment-forecast-rolling", -9),
      new PercentEnrollmentForecastAdjuster(2.9),
    ],
    [],
    3.4,
    9197.2,
  );
}
