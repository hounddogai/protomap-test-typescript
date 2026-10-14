import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledBidRuleForecast } from "./scheduled-bid-rule-forecast.js";

/** One step of the scheduled bid rule forecast calculation. */
export interface ScheduledBidRuleForecastAdjuster {
  describe(): string;
  adjust(item: ScheduledBidRuleForecast, value: number): number;
}

export class FlaggedScheduledBidRuleForecastAdjuster implements ScheduledBidRuleForecastAdjuster {
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

  adjust(item: ScheduledBidRuleForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledBidRuleForecastAdjuster implements ScheduledBidRuleForecastAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledBidRuleForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredScheduledBidRuleForecastAdjuster implements ScheduledBidRuleForecastAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledBidRuleForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapScheduledBidRuleForecastAdjuster implements ScheduledBidRuleForecastAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledBidRuleForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentScheduledBidRuleForecastAdjuster implements ScheduledBidRuleForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledBidRuleForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleScheduledBidRuleForecastAdjuster implements ScheduledBidRuleForecastAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ScheduledBidRuleForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled bid rule forecast steps in order and keeps a trace of each. */
export class ScheduledBidRuleForecastEngine {
  steps: ScheduledBidRuleForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledBidRuleForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledBidRuleForecast): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ScheduledBidRuleForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledBidRuleForecastEngine(flagsValue: flags.Registry): ScheduledBidRuleForecastEngine {
  return new ScheduledBidRuleForecastEngine(
    [
      new FlaggedScheduledBidRuleForecastAdjuster(flagsValue, "scheduled-bid-rule-forecast-legacy", -6.7),
      new MinimumScheduledBidRuleForecastAdjuster(15),
      new TieredScheduledBidRuleForecastAdjuster([4388, 6456], [0.94, 1.02]),
      new CapScheduledBidRuleForecastAdjuster(20595),
      new PercentScheduledBidRuleForecastAdjuster(0.6),
      new TitleScheduledBidRuleForecastAdjuster(new Map<string, number>([["west", 1.31], ["online", 1.25]])),
    ],
    [],
    2.1,
    26671.8,
  );
}
