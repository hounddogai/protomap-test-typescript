import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SuppressionForecast } from "./suppression-forecast.js";

/** One step of the suppression forecast calculation. */
export interface SuppressionForecastModifier {
  describe(): string;
  adjust(item: SuppressionForecast, value: number): number;
}

export class TieredSuppressionForecastAdjuster implements SuppressionForecastModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SuppressionForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSuppressionForecastAdjuster implements SuppressionForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SuppressionForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSuppressionForecastAdjuster implements SuppressionForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSuppressionForecastAdjuster implements SuppressionForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SuppressionForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSuppressionForecastAdjuster implements SuppressionForecastModifier {
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

  adjust(item: SuppressionForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the suppression forecast steps in order and keeps a trace of each. */
export class SuppressionForecastEngine {
  steps: SuppressionForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SuppressionForecast): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: SuppressionForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSuppressionForecastEngine(flagsValue: flags.Registry): SuppressionForecastEngine {
  return new SuppressionForecastEngine(
    [
      new TieredSuppressionForecastAdjuster([941, 3632, 5166], [0.89, 0.94, 1.07]),
      new CapSuppressionForecastAdjuster(36101),
      new PercentSuppressionForecastAdjuster(-2.6),
      new MinimumSuppressionForecastAdjuster(42.6),
      new FlaggedSuppressionForecastAdjuster(flagsValue, "suppression-forecast-tiered", 2.3),
    ],
    [],
    0.7,
    10256.9,
  );
}
