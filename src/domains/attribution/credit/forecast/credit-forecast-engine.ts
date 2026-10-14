import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditForecast } from "./credit-forecast.js";

/** One step of the credit forecast calculation. */
export interface CreditForecastStep {
  describe(): string;
  adjust(item: CreditForecast, value: number): number;
}

export class FlaggedCreditForecastAdjuster implements CreditForecastStep {
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

  adjust(item: CreditForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCreditForecastAdjuster implements CreditForecastStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCreditForecastAdjuster implements CreditForecastStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCreditForecastAdjuster implements CreditForecastStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the credit forecast steps in order and keeps a trace of each. */
export class CreditForecastEngine {
  steps: CreditForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditForecast): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: CreditForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditForecastEngine(flagsValue: flags.Registry): CreditForecastEngine {
  return new CreditForecastEngine(
    [
      new FlaggedCreditForecastAdjuster(flagsValue, "credit-forecast-pending", 1.7),
      new TieredCreditForecastAdjuster([5550, 6463], [0.93, 1.1]),
      new PercentCreditForecastAdjuster(-1.1),
      new RoundingCreditForecastAdjuster(0.05),
    ],
    [],
    3.2,
    73753.9,
  );
}
