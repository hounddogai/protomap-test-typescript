import * as flags from "../../../../kit/flags.js";
import { WarmupForecast } from "./warmup-forecast.js";

/** One step of the warmup forecast calculation. */
export interface WarmupForecastFactor {
  describe(): string;
  adjust(item: WarmupForecast, value: number): number;
}

export class FlaggedWarmupForecastAdjuster implements WarmupForecastFactor {
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

  adjust(item: WarmupForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelWarmupForecastAdjuster implements WarmupForecastFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WarmupForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWarmupForecastAdjuster implements WarmupForecastFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WarmupForecastCapacityOffsetAdjuster implements WarmupForecastFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: WarmupForecast, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class CapWarmupForecastAdjuster implements WarmupForecastFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the warmup forecast steps in order and keeps a trace of each. */
export class WarmupForecastEngine {
  steps: WarmupForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WarmupForecast): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: WarmupForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWarmupForecastEngine(flagsValue: flags.Registry): WarmupForecastEngine {
  return new WarmupForecastEngine(
    [
      new FlaggedWarmupForecastAdjuster(flagsValue, "warmup-forecast-scheduled", -8.3),
      new LabelWarmupForecastAdjuster(new Map<string, number>([["east", 1.05]])),
      new TieredWarmupForecastAdjuster([340, 713, 4399, 8127], [0.83, 1.18, 1, 0.81]),
      new WarmupForecastCapacityOffsetAdjuster(1.37),
      new CapWarmupForecastAdjuster(21580),
    ],
    [],
    4.2,
    82728.8,
  );
}
