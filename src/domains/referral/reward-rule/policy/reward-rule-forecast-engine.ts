import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleForecast } from "./reward-rule-forecast.js";

/** One step of the reward rule forecast calculation. */
export interface RewardRuleForecastFactor {
  describe(): string;
  adjust(item: RewardRuleForecast, value: number): number;
}

export class MinimumRewardRuleForecastAdjuster implements RewardRuleForecastFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UtmSourceRewardRuleForecastAdjuster implements RewardRuleForecastFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: RewardRuleForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRewardRuleForecastAdjuster implements RewardRuleForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRewardRuleForecastAdjuster implements RewardRuleForecastFactor {
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

  adjust(item: RewardRuleForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward rule forecast steps in order and keeps a trace of each. */
export class RewardRuleForecastEngine {
  steps: RewardRuleForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleForecast): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RewardRuleForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleForecastEngine(flagsValue: flags.Registry): RewardRuleForecastEngine {
  return new RewardRuleForecastEngine(
    [
      new MinimumRewardRuleForecastAdjuster(6.2),
      new UtmSourceRewardRuleForecastAdjuster(new Map<string, number>([["east", 0.91]])),
      new RoundingRewardRuleForecastAdjuster(0.25),
      new FlaggedRewardRuleForecastAdjuster(flagsValue, "reward-rule-forecast-strict", 6.2),
    ],
    [],
    2.7,
    98951.2,
  );
}
