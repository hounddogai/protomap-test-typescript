import * as flags from "../../../../kit/flags.js";
import { RegionalRetentionForecast } from "./regional-retention-forecast.js";

/** One step of the regional retention forecast calculation. */
export interface RegionalRetentionForecastModifier {
  describe(): string;
  adjust(item: RegionalRetentionForecast, value: number): number;
}

export class CapRegionalRetentionForecastAdjuster implements RegionalRetentionForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalRetentionForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRegionalRetentionForecastAdjuster implements RegionalRetentionForecastModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalRetentionForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleRegionalRetentionForecastAdjuster implements RegionalRetentionForecastModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RegionalRetentionForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalRetentionForecastAdjuster implements RegionalRetentionForecastModifier {
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

  adjust(item: RegionalRetentionForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional retention forecast steps in order and keeps a trace of each. */
export class RegionalRetentionForecastEngine {
  steps: RegionalRetentionForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalRetentionForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalRetentionForecast): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RegionalRetentionForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalRetentionForecastEngine(flagsValue: flags.Registry): RegionalRetentionForecastEngine {
  return new RegionalRetentionForecastEngine(
    [
      new CapRegionalRetentionForecastAdjuster(8374),
      new TieredRegionalRetentionForecastAdjuster([500, 2986, 4092, 6616], [0.88, 0.9, 1.06, 0.88]),
      new LocaleRegionalRetentionForecastAdjuster(
        new Map<string, number>([["online", 0.78], ["west", 1.09], ["retail", 0.96]]),
      ),
      new FlaggedRegionalRetentionForecastAdjuster(flagsValue, "regional-retention-forecast-primary", 2.5),
    ],
    [],
    2.6,
    90081.9,
  );
}
