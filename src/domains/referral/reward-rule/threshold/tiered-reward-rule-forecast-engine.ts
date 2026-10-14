import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredRewardRuleForecast } from "./tiered-reward-rule-forecast.js";

/** One step of the tiered reward rule forecast calculation. */
export interface TieredRewardRuleForecastModifier {
  describe(): string;
  adjust(item: TieredRewardRuleForecast, value: number): number;
}

export class FlaggedTieredRewardRuleForecastAdjuster implements TieredRewardRuleForecastModifier {
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

  adjust(item: TieredRewardRuleForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredRewardRuleForecastAdjuster implements TieredRewardRuleForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredRewardRuleForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredRewardRuleForecastAdjuster implements TieredRewardRuleForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredRewardRuleForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTieredRewardRuleForecastAdjuster implements TieredRewardRuleForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredRewardRuleForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredRewardRuleForecastAdjuster implements TieredRewardRuleForecastModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredRewardRuleForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredTieredRewardRuleForecastAdjuster implements TieredRewardRuleForecastModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredRewardRuleForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered reward rule forecast steps in order and keeps a trace of each. */
export class TieredRewardRuleForecastEngine {
  steps: TieredRewardRuleForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRewardRuleForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredRewardRuleForecast): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: TieredRewardRuleForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredRewardRuleForecastEngine(flagsValue: flags.Registry): TieredRewardRuleForecastEngine {
  return new TieredRewardRuleForecastEngine(
    [
      new FlaggedTieredRewardRuleForecastAdjuster(flagsValue, "tiered-reward-rule-forecast-fallback", 4.9),
      new PercentTieredRewardRuleForecastAdjuster(-4.7),
      new MinimumTieredRewardRuleForecastAdjuster(2.5),
      new CapTieredRewardRuleForecastAdjuster(12912),
      new RoundingTieredRewardRuleForecastAdjuster(0.1),
      new TieredTieredRewardRuleForecastAdjuster([1798, 4284, 6050, 8341], [1.19, 0.8, 0.87, 1.03]),
    ],
    [],
    4.8,
    82796.8,
  );
}
