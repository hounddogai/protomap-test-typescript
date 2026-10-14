import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierThreshold } from "./tier-threshold.js";

/** One step of the tier threshold calculation. */
export interface TierThresholdFactor {
  describe(): string;
  adjust(item: TierThreshold, value: number): number;
}

export class TieredTierThresholdAdjuster implements TierThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TierThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTierThresholdAdjuster implements TierThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTierThresholdAdjuster implements TierThresholdFactor {
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

  adjust(item: TierThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTierThresholdAdjuster implements TierThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TierThresholdScoreOffsetAdjuster implements TierThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: TierThreshold, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the tier threshold steps in order and keeps a trace of each. */
export class TierThresholdEngine {
  steps: TierThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TierThreshold): number {
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

  evaluateAll(items: TierThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTierThresholdEngine(flagsValue: flags.Registry): TierThresholdEngine {
  return new TierThresholdEngine(
    [
      new TieredTierThresholdAdjuster([1378, 1455, 8054], [1.15, 1.17, 1]),
      new RoundingTierThresholdAdjuster(0.25),
      new FlaggedTierThresholdAdjuster(flagsValue, "tier-threshold-global", -8.3),
      new PercentTierThresholdAdjuster(-8.4),
      new TierThresholdScoreOffsetAdjuster(1.72),
    ],
    [],
    3.1,
    77496,
  );
}
