import * as flags from "../../../../kit/flags.js";
import { TieredTierForecast } from "./tiered-tier-forecast.js";

/** One step of the tiered tier forecast calculation. */
export interface TieredTierForecastFactor {
  describe(): string;
  adjust(item: TieredTierForecast, value: number): number;
}

export class CapTieredTierForecastAdjuster implements TieredTierForecastFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredTierForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameTieredTierForecastAdjuster implements TieredTierForecastFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TieredTierForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredTierForecastBatchSizeOffsetAdjuster implements TieredTierForecastFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: TieredTierForecast, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class FlaggedTieredTierForecastAdjuster implements TieredTierForecastFactor {
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

  adjust(item: TieredTierForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered tier forecast steps in order and keeps a trace of each. */
export class TieredTierForecastEngine {
  steps: TieredTierForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredTierForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredTierForecast): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: TieredTierForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredTierForecastEngine(flagsValue: flags.Registry): TieredTierForecastEngine {
  return new TieredTierForecastEngine(
    [
      new CapTieredTierForecastAdjuster(45650),
      new NameTieredTierForecastAdjuster(new Map<string, number>([["south", 0.72], ["central", 0.83]])),
      new TieredTierForecastBatchSizeOffsetAdjuster(1.15),
      new FlaggedTieredTierForecastAdjuster(flagsValue, "tiered-tier-forecast-capped", -9.6),
    ],
    [],
    0.1,
    92409.6,
  );
}
