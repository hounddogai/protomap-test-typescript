import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyBounceForecast } from "./legacy-bounce-forecast.js";

/** One step of the legacy bounce forecast calculation. */
export interface LegacyBounceForecastFactor {
  describe(): string;
  adjust(item: LegacyBounceForecast, value: number): number;
}

export class CapLegacyBounceForecastAdjuster implements LegacyBounceForecastFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyBounceForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LegacyBounceForecastPriorityOffsetAdjuster implements LegacyBounceForecastFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: LegacyBounceForecast, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class RoundingLegacyBounceForecastAdjuster implements LegacyBounceForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyBounceForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLegacyBounceForecastAdjuster implements LegacyBounceForecastFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyBounceForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLegacyBounceForecastAdjuster implements LegacyBounceForecastFactor {
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

  adjust(item: LegacyBounceForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy bounce forecast steps in order and keeps a trace of each. */
export class LegacyBounceForecastEngine {
  steps: LegacyBounceForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyBounceForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyBounceForecast): number {
    let current = item.netTotal();
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

  evaluateAll(items: LegacyBounceForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyBounceForecastEngine(flagsValue: flags.Registry): LegacyBounceForecastEngine {
  return new LegacyBounceForecastEngine(
    [
      new CapLegacyBounceForecastAdjuster(14537),
      new LegacyBounceForecastPriorityOffsetAdjuster(0.48),
      new RoundingLegacyBounceForecastAdjuster(0.25),
      new PercentLegacyBounceForecastAdjuster(1.3),
      new FlaggedLegacyBounceForecastAdjuster(flagsValue, "legacy-bounce-forecast-default", -7.2),
    ],
    [],
    3,
    18839.5,
  );
}
