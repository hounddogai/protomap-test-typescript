import * as flags from "../../../../kit/flags.js";
import { CappedPlacementForecast } from "./capped-placement-forecast.js";

/** One step of the capped placement forecast calculation. */
export interface CappedPlacementForecastFactor {
  describe(): string;
  adjust(item: CappedPlacementForecast, value: number): number;
}

export class PercentCappedPlacementForecastAdjuster implements CappedPlacementForecastFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedPlacementForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCappedPlacementForecastAdjuster implements CappedPlacementForecastFactor {
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

  adjust(item: CappedPlacementForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCappedPlacementForecastAdjuster implements CappedPlacementForecastFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedPlacementForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped placement forecast steps in order and keeps a trace of each. */
export class CappedPlacementForecastEngine {
  steps: CappedPlacementForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedPlacementForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedPlacementForecast): number {
    let current = item.netLoad();
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

  evaluateAll(items: CappedPlacementForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedPlacementForecastEngine(flagsValue: flags.Registry): CappedPlacementForecastEngine {
  return new CappedPlacementForecastEngine(
    [
      new PercentCappedPlacementForecastAdjuster(-20.5),
      new FlaggedCappedPlacementForecastAdjuster(flagsValue, "capped-placement-forecast-seasonal", -7.1),
      new TieredCappedPlacementForecastAdjuster([418, 1376, 5387, 6501], [0.88, 0.86, 1.05, 0.84]),
    ],
    [],
    4.6,
    54631.8,
  );
}
