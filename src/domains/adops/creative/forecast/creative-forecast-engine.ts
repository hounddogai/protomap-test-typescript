import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreativeForecast } from "./creative-forecast.js";

/** One step of the creative forecast calculation. */
export interface CreativeForecastModifier {
  describe(): string;
  adjust(item: CreativeForecast, value: number): number;
}

export class RoundingCreativeForecastAdjuster implements CreativeForecastModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCreativeForecastAdjuster implements CreativeForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreativeForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CreativeForecastOpenRateOffsetAdjuster implements CreativeForecastModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: CreativeForecast, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class FlaggedCreativeForecastAdjuster implements CreativeForecastModifier {
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

  adjust(item: CreativeForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCreativeForecastAdjuster implements CreativeForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCreativeForecastAdjuster implements CreativeForecastModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the creative forecast steps in order and keeps a trace of each. */
export class CreativeForecastEngine {
  steps: CreativeForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreativeForecast): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: CreativeForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreativeForecastEngine(flagsValue: flags.Registry): CreativeForecastEngine {
  return new CreativeForecastEngine(
    [
      new RoundingCreativeForecastAdjuster(0.25),
      new MinimumCreativeForecastAdjuster(17.1),
      new CreativeForecastOpenRateOffsetAdjuster(1.55),
      new FlaggedCreativeForecastAdjuster(flagsValue, "creative-forecast-regional", 4),
      new PercentCreativeForecastAdjuster(-4.4),
      new TieredCreativeForecastAdjuster([5540, 6715, 7757, 8453], [1.06, 0.88, 0.81, 1.07]),
    ],
    [],
    3.5,
    29707.2,
  );
}
