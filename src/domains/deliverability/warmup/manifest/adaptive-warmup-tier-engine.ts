import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveWarmupTier } from "./adaptive-warmup-tier.js";

/** One step of the adaptive warmup tier calculation. */
export interface AdaptiveWarmupTierFactor {
  describe(): string;
  adjust(item: AdaptiveWarmupTier, value: number): number;
}

export class AdaptiveWarmupTierSendAtOffsetAdjuster implements AdaptiveWarmupTierFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: AdaptiveWarmupTier, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class PercentAdaptiveWarmupTierAdjuster implements AdaptiveWarmupTierFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveWarmupTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveWarmupTierAdjuster implements AdaptiveWarmupTierFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveWarmupTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionAdaptiveWarmupTierAdjuster implements AdaptiveWarmupTierFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: AdaptiveWarmupTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedAdaptiveWarmupTierAdjuster implements AdaptiveWarmupTierFactor {
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

  adjust(item: AdaptiveWarmupTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive warmup tier steps in order and keeps a trace of each. */
export class AdaptiveWarmupTierEngine {
  steps: AdaptiveWarmupTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveWarmupTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveWarmupTier): number {
    let current = item.netExposure();
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

  evaluateAll(items: AdaptiveWarmupTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveWarmupTierEngine(flagsValue: flags.Registry): AdaptiveWarmupTierEngine {
  return new AdaptiveWarmupTierEngine(
    [
      new AdaptiveWarmupTierSendAtOffsetAdjuster(1.68),
      new PercentAdaptiveWarmupTierAdjuster(-9.2),
      new TieredAdaptiveWarmupTierAdjuster([2284, 2472], [1.04, 1.13]),
      new RegionAdaptiveWarmupTierAdjuster(new Map<string, number>([["central", 1.2], ["retail", 0.95]])),
      new FlaggedAdaptiveWarmupTierAdjuster(flagsValue, "adaptive-warmup-tier-batched", 2.3),
    ],
    [],
    4.5,
    46843.8,
  );
}
