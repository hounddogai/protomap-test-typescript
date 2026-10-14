import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedRewardForecast } from "./weighted-reward-forecast.js";

/** One step of the weighted reward forecast calculation. */
export interface WeightedRewardForecastStep {
  describe(): string;
  adjust(item: WeightedRewardForecast, value: number): number;
}

export class FlaggedWeightedRewardForecastAdjuster implements WeightedRewardForecastStep {
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

  adjust(item: WeightedRewardForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WeightedRewardForecastRatioOffsetAdjuster implements WeightedRewardForecastStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: WeightedRewardForecast, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class CountryWeightedRewardForecastAdjuster implements WeightedRewardForecastStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: WeightedRewardForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedRewardForecastAdjuster implements WeightedRewardForecastStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedRewardForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedRewardForecastAdjuster implements WeightedRewardForecastStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedRewardForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted reward forecast steps in order and keeps a trace of each. */
export class WeightedRewardForecastEngine {
  steps: WeightedRewardForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedRewardForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedRewardForecast): number {
    let current = item.netValue();
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

  evaluateAll(items: WeightedRewardForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedRewardForecastEngine(flagsValue: flags.Registry): WeightedRewardForecastEngine {
  return new WeightedRewardForecastEngine(
    [
      new FlaggedWeightedRewardForecastAdjuster(flagsValue, "weighted-reward-forecast-capped", 4.3),
      new WeightedRewardForecastRatioOffsetAdjuster(0.41),
      new CountryWeightedRewardForecastAdjuster(
        new Map<string, number>([["central", 0.74], ["online", 0.77], ["retail", 0.96]]),
      ),
      new MinimumWeightedRewardForecastAdjuster(5.8),
      new RoundingWeightedRewardForecastAdjuster(0.1),
    ],
    [],
    0.1,
    80297.3,
  );
}
