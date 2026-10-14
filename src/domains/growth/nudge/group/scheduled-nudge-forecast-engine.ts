import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledNudgeForecast } from "./scheduled-nudge-forecast.js";

/** One step of the scheduled nudge forecast calculation. */
export interface ScheduledNudgeForecastFactor {
  describe(): string;
  adjust(item: ScheduledNudgeForecast, value: number): number;
}

export class FlaggedScheduledNudgeForecastAdjuster implements ScheduledNudgeForecastFactor {
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

  adjust(item: ScheduledNudgeForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentScheduledNudgeForecastAdjuster implements ScheduledNudgeForecastFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledNudgeForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingScheduledNudgeForecastAdjuster implements ScheduledNudgeForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledNudgeForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledNudgeForecastAdjuster implements ScheduledNudgeForecastFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledNudgeForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled nudge forecast steps in order and keeps a trace of each. */
export class ScheduledNudgeForecastEngine {
  steps: ScheduledNudgeForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledNudgeForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledNudgeForecast): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ScheduledNudgeForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledNudgeForecastEngine(flagsValue: flags.Registry): ScheduledNudgeForecastEngine {
  return new ScheduledNudgeForecastEngine(
    [
      new FlaggedScheduledNudgeForecastAdjuster(flagsValue, "scheduled-nudge-forecast-primary", 0.6),
      new PercentScheduledNudgeForecastAdjuster(-17.5),
      new RoundingScheduledNudgeForecastAdjuster(0.05),
      new CapScheduledNudgeForecastAdjuster(28822),
    ],
    [],
    1.5,
    49534.3,
  );
}
