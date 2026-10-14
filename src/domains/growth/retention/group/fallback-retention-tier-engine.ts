import * as flags from "../../../../kit/flags.js";
import { FallbackRetentionTier } from "./fallback-retention-tier.js";

/** One step of the fallback retention tier calculation. */
export interface FallbackRetentionTierAdjuster {
  describe(): string;
  adjust(item: FallbackRetentionTier, value: number): number;
}

export class MinimumFallbackRetentionTierAdjuster implements FallbackRetentionTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackRetentionTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFallbackRetentionTierAdjuster implements FallbackRetentionTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackRetentionTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackRetentionTierAdjuster implements FallbackRetentionTierAdjuster {
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

  adjust(item: FallbackRetentionTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FallbackRetentionTierBudgetOffsetAdjuster implements FallbackRetentionTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: FallbackRetentionTier, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentFallbackRetentionTierAdjuster implements FallbackRetentionTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackRetentionTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleFallbackRetentionTierAdjuster implements FallbackRetentionTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: FallbackRetentionTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback retention tier steps in order and keeps a trace of each. */
export class FallbackRetentionTierEngine {
  steps: FallbackRetentionTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackRetentionTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackRetentionTier): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: FallbackRetentionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackRetentionTierEngine(flagsValue: flags.Registry): FallbackRetentionTierEngine {
  return new FallbackRetentionTierEngine(
    [
      new MinimumFallbackRetentionTierAdjuster(7.7),
      new TieredFallbackRetentionTierAdjuster([3607, 7295, 8265, 9092], [1.03, 0.84, 0.97, 0.82]),
      new FlaggedFallbackRetentionTierAdjuster(flagsValue, "fallback-retention-tier-fallback", -9.7),
      new FallbackRetentionTierBudgetOffsetAdjuster(1.2),
      new PercentFallbackRetentionTierAdjuster(-13.6),
      new TitleFallbackRetentionTierAdjuster(new Map<string, number>([["central", 1.29], ["west", 1.26]])),
    ],
    [],
    0.9,
    52766.2,
  );
}
