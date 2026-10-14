import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalRewardRuleForecast } from "./seasonal-reward-rule-forecast.js";

/** One step of the seasonal reward rule forecast calculation. */
export interface SeasonalRewardRuleForecastAdjuster {
  describe(): string;
  adjust(item: SeasonalRewardRuleForecast, value: number): number;
}

export class TieredSeasonalRewardRuleForecastAdjuster implements SeasonalRewardRuleForecastAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalRewardRuleForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSeasonalRewardRuleForecastAdjuster implements SeasonalRewardRuleForecastAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalRewardRuleForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedSeasonalRewardRuleForecastAdjuster implements SeasonalRewardRuleForecastAdjuster {
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

  adjust(item: SeasonalRewardRuleForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalRewardRuleForecastFloorValueOffsetAdjuster implements SeasonalRewardRuleForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: SeasonalRewardRuleForecast, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the seasonal reward rule forecast steps in order and keeps a trace of each. */
export class SeasonalRewardRuleForecastEngine {
  steps: SeasonalRewardRuleForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalRewardRuleForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalRewardRuleForecast): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SeasonalRewardRuleForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalRewardRuleForecastEngine(flagsValue: flags.Registry): SeasonalRewardRuleForecastEngine {
  return new SeasonalRewardRuleForecastEngine(
    [
      new TieredSeasonalRewardRuleForecastAdjuster([4740, 7012, 8566, 9956], [0.91, 1.12, 1.12, 1.14]),
      new RoundingSeasonalRewardRuleForecastAdjuster(0.25),
      new FlaggedSeasonalRewardRuleForecastAdjuster(flagsValue, "seasonal-reward-rule-forecast-adaptive", -8.8),
      new SeasonalRewardRuleForecastFloorValueOffsetAdjuster(0.46),
    ],
    [],
    3.9,
    93066.6,
  );
}
