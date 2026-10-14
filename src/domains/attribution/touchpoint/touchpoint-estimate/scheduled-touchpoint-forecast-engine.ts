import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledTouchpointForecast } from "./scheduled-touchpoint-forecast.js";

/** One step of the scheduled touchpoint forecast calculation. */
export interface ScheduledTouchpointForecastFactor {
  describe(): string;
  adjust(item: ScheduledTouchpointForecast, value: number): number;
}

export class MinimumScheduledTouchpointForecastAdjuster implements ScheduledTouchpointForecastFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledTouchpointForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingScheduledTouchpointForecastAdjuster implements ScheduledTouchpointForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledTouchpointForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentScheduledTouchpointForecastAdjuster implements ScheduledTouchpointForecastFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledTouchpointForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedScheduledTouchpointForecastAdjuster implements ScheduledTouchpointForecastFactor {
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

  adjust(item: ScheduledTouchpointForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled touchpoint forecast steps in order and keeps a trace of each. */
export class ScheduledTouchpointForecastEngine {
  steps: ScheduledTouchpointForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledTouchpointForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledTouchpointForecast): number {
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

  evaluateAll(items: ScheduledTouchpointForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledTouchpointForecastEngine(flagsValue: flags.Registry): ScheduledTouchpointForecastEngine {
  return new ScheduledTouchpointForecastEngine(
    [
      new MinimumScheduledTouchpointForecastAdjuster(12.9),
      new RoundingScheduledTouchpointForecastAdjuster(0.1),
      new PercentScheduledTouchpointForecastAdjuster(-16.6),
      new FlaggedScheduledTouchpointForecastAdjuster(flagsValue, "scheduled-touchpoint-forecast-regional", -4.5),
    ],
    [],
    1.7,
    79211.2,
  );
}
