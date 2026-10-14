import * as flags from "../../../../kit/flags.js";
import { LegacyDoubleOptInForecast } from "./legacy-double-opt-in-forecast.js";

/** One step of the legacy double opt in forecast calculation. */
export interface LegacyDoubleOptInForecastAdjuster {
  describe(): string;
  adjust(item: LegacyDoubleOptInForecast, value: number): number;
}

export class PercentLegacyDoubleOptInForecastAdjuster implements LegacyDoubleOptInForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyDoubleOptInForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLegacyDoubleOptInForecastAdjuster implements LegacyDoubleOptInForecastAdjuster {
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

  adjust(item: LegacyDoubleOptInForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacyDoubleOptInForecastAdjuster implements LegacyDoubleOptInForecastAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyDoubleOptInForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy double opt in forecast steps in order and keeps a trace of each. */
export class LegacyDoubleOptInForecastEngine {
  steps: LegacyDoubleOptInForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyDoubleOptInForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyDoubleOptInForecast): number {
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

  evaluateAll(items: LegacyDoubleOptInForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyDoubleOptInForecastEngine(flagsValue: flags.Registry): LegacyDoubleOptInForecastEngine {
  return new LegacyDoubleOptInForecastEngine(
    [
      new PercentLegacyDoubleOptInForecastAdjuster(-8),
      new FlaggedLegacyDoubleOptInForecastAdjuster(flagsValue, "legacy-double-opt-in-forecast-primary", -6.4),
      new TieredLegacyDoubleOptInForecastAdjuster([1767, 5487], [0.8, 0.81]),
    ],
    [],
    0.2,
    2220.8,
  );
}
