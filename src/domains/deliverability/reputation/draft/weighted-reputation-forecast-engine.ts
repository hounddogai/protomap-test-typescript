import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedReputationForecast } from "./weighted-reputation-forecast.js";

/** One step of the weighted reputation forecast calculation. */
export interface WeightedReputationForecastFactor {
  describe(): string;
  adjust(item: WeightedReputationForecast, value: number): number;
}

export class RoundingWeightedReputationForecastAdjuster implements WeightedReputationForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedReputationForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedReputationForecastAdjuster implements WeightedReputationForecastFactor {
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

  adjust(item: WeightedReputationForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WeightedReputationForecastSendAtOffsetAdjuster implements WeightedReputationForecastFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: WeightedReputationForecast, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class CapWeightedReputationForecastAdjuster implements WeightedReputationForecastFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedReputationForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleWeightedReputationForecastAdjuster implements WeightedReputationForecastFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WeightedReputationForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted reputation forecast steps in order and keeps a trace of each. */
export class WeightedReputationForecastEngine {
  steps: WeightedReputationForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedReputationForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedReputationForecast): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: WeightedReputationForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedReputationForecastEngine(flagsValue: flags.Registry): WeightedReputationForecastEngine {
  return new WeightedReputationForecastEngine(
    [
      new RoundingWeightedReputationForecastAdjuster(0.25),
      new FlaggedWeightedReputationForecastAdjuster(flagsValue, "weighted-reputation-forecast-strict", -0.4),
      new WeightedReputationForecastSendAtOffsetAdjuster(1.32),
      new CapWeightedReputationForecastAdjuster(3622),
      new LocaleWeightedReputationForecastAdjuster(
        new Map<string, number>([["south", 1.05], ["central", 0.72]]),
      ),
    ],
    [],
    4.8,
    72828.1,
  );
}
