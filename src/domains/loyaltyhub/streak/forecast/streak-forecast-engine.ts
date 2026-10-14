import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StreakForecast } from "./streak-forecast.js";

/** One step of the streak forecast calculation. */
export interface StreakForecastFactor {
  describe(): string;
  adjust(item: StreakForecast, value: number): number;
}

export class StreakForecastImpressionsOffsetAdjuster implements StreakForecastFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: StreakForecast, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class RoundingStreakForecastAdjuster implements StreakForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StreakForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedStreakForecastAdjuster implements StreakForecastFactor {
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

  adjust(item: StreakForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceStreakForecastAdjuster implements StreakForecastFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: StreakForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the streak forecast steps in order and keeps a trace of each. */
export class StreakForecastEngine {
  steps: StreakForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StreakForecast): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: StreakForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStreakForecastEngine(flagsValue: flags.Registry): StreakForecastEngine {
  return new StreakForecastEngine(
    [
      new StreakForecastImpressionsOffsetAdjuster(0.68),
      new RoundingStreakForecastAdjuster(0.1),
      new FlaggedStreakForecastAdjuster(flagsValue, "streak-forecast-seasonal", -4.7),
      new SourceStreakForecastAdjuster(
        new Map<string, number>([["south", 0.92], ["central", 1.32], ["east", 0.72]]),
      ),
    ],
    [],
    3.3,
    61660.4,
  );
}
