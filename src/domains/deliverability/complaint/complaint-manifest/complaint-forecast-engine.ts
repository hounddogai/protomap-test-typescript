import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ComplaintForecast } from "./complaint-forecast.js";

/** One step of the complaint forecast calculation. */
export interface ComplaintForecastAdjuster {
  describe(): string;
  adjust(item: ComplaintForecast, value: number): number;
}

export class MinimumComplaintForecastAdjuster implements ComplaintForecastAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedComplaintForecastAdjuster implements ComplaintForecastAdjuster {
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

  adjust(item: ComplaintForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingComplaintForecastAdjuster implements ComplaintForecastAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the complaint forecast steps in order and keeps a trace of each. */
export class ComplaintForecastEngine {
  steps: ComplaintForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ComplaintForecast): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ComplaintForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultComplaintForecastEngine(flagsValue: flags.Registry): ComplaintForecastEngine {
  return new ComplaintForecastEngine(
    [
      new MinimumComplaintForecastAdjuster(25.9),
      new FlaggedComplaintForecastAdjuster(flagsValue, "complaint-forecast-seasonal", 9.4),
      new RoundingComplaintForecastAdjuster(0.05),
    ],
    [],
    4.8,
    29028.3,
  );
}
