import * as flags from "../../../../kit/flags.js";
import { RegionalFrequencyForecast } from "./regional-frequency-forecast.js";

/** One step of the regional frequency forecast calculation. */
export interface RegionalFrequencyForecastStep {
  describe(): string;
  adjust(item: RegionalFrequencyForecast, value: number): number;
}

export class PercentRegionalFrequencyForecastAdjuster implements RegionalFrequencyForecastStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalFrequencyForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalFrequencyForecastAdjuster implements RegionalFrequencyForecastStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalFrequencyForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRegionalFrequencyForecastAdjuster implements RegionalFrequencyForecastStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalFrequencyForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRegionalFrequencyForecastAdjuster implements RegionalFrequencyForecastStep {
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

  adjust(item: RegionalFrequencyForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional frequency forecast steps in order and keeps a trace of each. */
export class RegionalFrequencyForecastEngine {
  steps: RegionalFrequencyForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalFrequencyForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalFrequencyForecast): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: RegionalFrequencyForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalFrequencyForecastEngine(flagsValue: flags.Registry): RegionalFrequencyForecastEngine {
  return new RegionalFrequencyForecastEngine(
    [
      new PercentRegionalFrequencyForecastAdjuster(-14.4),
      new CapRegionalFrequencyForecastAdjuster(34125),
      new MinimumRegionalFrequencyForecastAdjuster(45.9),
      new FlaggedRegionalFrequencyForecastAdjuster(flagsValue, "regional-frequency-forecast-manual", 1.8),
    ],
    [],
    2.7,
    60259.8,
  );
}
