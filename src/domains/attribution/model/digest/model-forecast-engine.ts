import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ModelForecast } from "./model-forecast.js";

/** One step of the model forecast calculation. */
export interface ModelForecastStep {
  describe(): string;
  adjust(item: ModelForecast, value: number): number;
}

export class PercentModelForecastAdjuster implements ModelForecastStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleModelForecastAdjuster implements ModelForecastStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ModelForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredModelForecastAdjuster implements ModelForecastStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ModelForecastWindowDaysOffsetAdjuster implements ModelForecastStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: ModelForecast, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class FlaggedModelForecastAdjuster implements ModelForecastStep {
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

  adjust(item: ModelForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the model forecast steps in order and keeps a trace of each. */
export class ModelForecastEngine {
  steps: ModelForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ModelForecast): number {
    let current = item.netTotal();
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

  evaluateAll(items: ModelForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultModelForecastEngine(flagsValue: flags.Registry): ModelForecastEngine {
  return new ModelForecastEngine(
    [
      new PercentModelForecastAdjuster(-13.6),
      new LocaleModelForecastAdjuster(
        new Map<string, number>([["west", 1.19], ["south", 1.1], ["online", 0.91]]),
      ),
      new TieredModelForecastAdjuster([2255, 8526], [0.89, 1.13]),
      new ModelForecastWindowDaysOffsetAdjuster(0.69),
      new FlaggedModelForecastAdjuster(flagsValue, "model-forecast-tiered", 6.6),
    ],
    [],
    4.9,
    51289.7,
  );
}
