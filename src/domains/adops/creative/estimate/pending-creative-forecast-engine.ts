import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingCreativeForecast } from "./pending-creative-forecast.js";

/** One step of the pending creative forecast calculation. */
export interface PendingCreativeForecastAdjuster {
  describe(): string;
  adjust(item: PendingCreativeForecast, value: number): number;
}

export class FlaggedPendingCreativeForecastAdjuster implements PendingCreativeForecastAdjuster {
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

  adjust(item: PendingCreativeForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingCreativeForecastAdjuster implements PendingCreativeForecastAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingCreativeForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPendingCreativeForecastAdjuster implements PendingCreativeForecastAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingCreativeForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingCreativeForecastAdjuster implements PendingCreativeForecastAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingCreativeForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPendingCreativeForecastAdjuster implements PendingCreativeForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingCreativeForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PendingCreativeForecastCeilingOffsetAdjuster implements PendingCreativeForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: PendingCreativeForecast, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

/** Runs the pending creative forecast steps in order and keeps a trace of each. */
export class PendingCreativeForecastEngine {
  steps: PendingCreativeForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingCreativeForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingCreativeForecast): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: PendingCreativeForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingCreativeForecastEngine(flagsValue: flags.Registry): PendingCreativeForecastEngine {
  return new PendingCreativeForecastEngine(
    [
      new FlaggedPendingCreativeForecastAdjuster(flagsValue, "pending-creative-forecast-default", 7.6),
      new MinimumPendingCreativeForecastAdjuster(20.3),
      new CapPendingCreativeForecastAdjuster(9464),
      new TieredPendingCreativeForecastAdjuster([3256, 3634, 3992], [1.06, 0.95, 1.12]),
      new PercentPendingCreativeForecastAdjuster(-19.3),
      new PendingCreativeForecastCeilingOffsetAdjuster(1.7),
    ],
    [],
    2.8,
    91451.3,
  );
}
