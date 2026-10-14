import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelForecast } from "./level-forecast.js";

/** One step of the level forecast calculation. */
export interface LevelForecastModifier {
  describe(): string;
  adjust(item: LevelForecast, value: number): number;
}

export class TieredLevelForecastAdjuster implements LevelForecastModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLevelForecastAdjuster implements LevelForecastModifier {
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

  adjust(item: LevelForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLevelForecastAdjuster implements LevelForecastModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the level forecast steps in order and keeps a trace of each. */
export class LevelForecastEngine {
  steps: LevelForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LevelForecast): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: LevelForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLevelForecastEngine(flagsValue: flags.Registry): LevelForecastEngine {
  return new LevelForecastEngine(
    [
      new TieredLevelForecastAdjuster([1128, 5928], [0.92, 0.85]),
      new FlaggedLevelForecastAdjuster(flagsValue, "level-forecast-default", 4.8),
      new RoundingLevelForecastAdjuster(5),
    ],
    [],
    1.3,
    14728,
  );
}
