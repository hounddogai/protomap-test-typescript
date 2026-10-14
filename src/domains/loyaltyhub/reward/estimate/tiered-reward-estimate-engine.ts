import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredRewardEstimate } from "./tiered-reward-estimate.js";

/** One step of the tiered reward estimate calculation. */
export interface TieredRewardEstimateModifier {
  describe(): string;
  adjust(item: TieredRewardEstimate, value: number): number;
}

export class FlaggedTieredRewardEstimateAdjuster implements TieredRewardEstimateModifier {
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

  adjust(item: TieredRewardEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredRewardEstimateAdjuster implements TieredRewardEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredRewardEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TieredRewardEstimateStartsAtOffsetAdjuster implements TieredRewardEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: TieredRewardEstimate, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class CapTieredRewardEstimateAdjuster implements TieredRewardEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredRewardEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredRewardEstimateAdjuster implements TieredRewardEstimateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredRewardEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTieredRewardEstimateAdjuster implements TieredRewardEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredRewardEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered reward estimate steps in order and keeps a trace of each. */
export class TieredRewardEstimateEngine {
  steps: TieredRewardEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRewardEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredRewardEstimate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TieredRewardEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredRewardEstimateEngine(flagsValue: flags.Registry): TieredRewardEstimateEngine {
  return new TieredRewardEstimateEngine(
    [
      new FlaggedTieredRewardEstimateAdjuster(flagsValue, "tiered-reward-estimate-pending", -8.4),
      new TieredTieredRewardEstimateAdjuster([967, 5967, 8954, 9445], [1.14, 1.08, 1.11, 0.82]),
      new TieredRewardEstimateStartsAtOffsetAdjuster(1.89),
      new CapTieredRewardEstimateAdjuster(19231),
      new MinimumTieredRewardEstimateAdjuster(16.1),
      new PercentTieredRewardEstimateAdjuster(22),
    ],
    [],
    2,
    65345,
  );
}
