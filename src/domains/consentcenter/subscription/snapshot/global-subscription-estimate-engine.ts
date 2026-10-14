import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalSubscriptionEstimate } from "./global-subscription-estimate.js";

/** One step of the global subscription estimate calculation. */
export interface GlobalSubscriptionEstimateFactor {
  describe(): string;
  adjust(item: GlobalSubscriptionEstimate, value: number): number;
}

export class CapGlobalSubscriptionEstimateAdjuster implements GlobalSubscriptionEstimateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalSubscriptionEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingGlobalSubscriptionEstimateAdjuster implements GlobalSubscriptionEstimateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalSubscriptionEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedGlobalSubscriptionEstimateAdjuster implements GlobalSubscriptionEstimateFactor {
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

  adjust(item: GlobalSubscriptionEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalSubscriptionEstimateAdjuster implements GlobalSubscriptionEstimateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalSubscriptionEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class GlobalSubscriptionEstimateConversionRateOffsetAdjuster implements GlobalSubscriptionEstimateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: GlobalSubscriptionEstimate, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the global subscription estimate steps in order and keeps a trace of each. */
export class GlobalSubscriptionEstimateEngine {
  steps: GlobalSubscriptionEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSubscriptionEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalSubscriptionEstimate): number {
    let current = item.netVolume();
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

  evaluateAll(items: GlobalSubscriptionEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalSubscriptionEstimateEngine(flagsValue: flags.Registry): GlobalSubscriptionEstimateEngine {
  return new GlobalSubscriptionEstimateEngine(
    [
      new CapGlobalSubscriptionEstimateAdjuster(3387),
      new RoundingGlobalSubscriptionEstimateAdjuster(0.25),
      new FlaggedGlobalSubscriptionEstimateAdjuster(flagsValue, "global-subscription-estimate-legacy", 5.5),
      new TieredGlobalSubscriptionEstimateAdjuster([1133, 4621, 5238, 6733], [0.84, 0.84, 0.87, 1.17]),
      new GlobalSubscriptionEstimateConversionRateOffsetAdjuster(1.69),
    ],
    [],
    1.5,
    98286.5,
  );
}
