import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleForecast } from "./bid-rule-forecast.js";

/** One step of the bid rule forecast calculation. */
export interface BidRuleForecastAdjuster {
  describe(): string;
  adjust(item: BidRuleForecast, value: number): number;
}

export class RoundingBidRuleForecastAdjuster implements BidRuleForecastAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBidRuleForecastAdjuster implements BidRuleForecastAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBidRuleForecastAdjuster implements BidRuleForecastAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BidRuleForecastMinimumOffsetAdjuster implements BidRuleForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: BidRuleForecast, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class PercentBidRuleForecastAdjuster implements BidRuleForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBidRuleForecastAdjuster implements BidRuleForecastAdjuster {
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

  adjust(item: BidRuleForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the bid rule forecast steps in order and keeps a trace of each. */
export class BidRuleForecastEngine {
  steps: BidRuleForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BidRuleForecast): number {
    let current = item.netVolume();
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

  evaluateAll(items: BidRuleForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBidRuleForecastEngine(flagsValue: flags.Registry): BidRuleForecastEngine {
  return new BidRuleForecastEngine(
    [
      new RoundingBidRuleForecastAdjuster(0.25),
      new CapBidRuleForecastAdjuster(14078),
      new TieredBidRuleForecastAdjuster([324, 4140, 9307], [1.09, 1.04, 1.12]),
      new BidRuleForecastMinimumOffsetAdjuster(0.26),
      new PercentBidRuleForecastAdjuster(-23.4),
      new FlaggedBidRuleForecastAdjuster(flagsValue, "bid-rule-forecast-tiered", -6.5),
    ],
    [],
    1.2,
    95459.6,
  );
}
