import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyStepForecast } from "./legacy-step-forecast.js";

/** One step of the legacy step forecast calculation. */
export interface LegacyStepForecastAdjuster {
  describe(): string;
  adjust(item: LegacyStepForecast, value: number): number;
}

export class PercentLegacyStepForecastAdjuster implements LegacyStepForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyStepForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacyStepForecastAdjuster implements LegacyStepForecastAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyStepForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLegacyStepForecastAdjuster implements LegacyStepForecastAdjuster {
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

  adjust(item: LegacyStepForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy step forecast steps in order and keeps a trace of each. */
export class LegacyStepForecastEngine {
  steps: LegacyStepForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyStepForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyStepForecast): number {
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

  evaluateAll(items: LegacyStepForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyStepForecastEngine(flagsValue: flags.Registry): LegacyStepForecastEngine {
  return new LegacyStepForecastEngine(
    [
      new PercentLegacyStepForecastAdjuster(23.3),
      new TieredLegacyStepForecastAdjuster([2789, 3230, 4973], [1.16, 0.81, 1.19]),
      new FlaggedLegacyStepForecastAdjuster(flagsValue, "legacy-step-forecast-legacy", -6.5),
    ],
    [],
    5,
    44193.8,
  );
}
