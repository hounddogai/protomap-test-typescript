import * as flags from "../../../../kit/flags.js";
import { LegacyStreakTier } from "./legacy-streak-tier.js";

/** One step of the legacy streak tier calculation. */
export interface LegacyStreakTierAdjuster {
  describe(): string;
  adjust(item: LegacyStreakTier, value: number): number;
}

export class PercentLegacyStreakTierAdjuster implements LegacyStreakTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyStreakTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLegacyStreakTierAdjuster implements LegacyStreakTierAdjuster {
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

  adjust(item: LegacyStreakTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyStreakTierAdjuster implements LegacyStreakTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyStreakTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameLegacyStreakTierAdjuster implements LegacyStreakTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LegacyStreakTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLegacyStreakTierAdjuster implements LegacyStreakTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyStreakTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy streak tier steps in order and keeps a trace of each. */
export class LegacyStreakTierEngine {
  steps: LegacyStreakTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyStreakTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyStreakTier): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LegacyStreakTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyStreakTierEngine(flagsValue: flags.Registry): LegacyStreakTierEngine {
  return new LegacyStreakTierEngine(
    [
      new PercentLegacyStreakTierAdjuster(-8),
      new FlaggedLegacyStreakTierAdjuster(flagsValue, "legacy-streak-tier-strict", -1.4),
      new CapLegacyStreakTierAdjuster(24770),
      new NameLegacyStreakTierAdjuster(new Map<string, number>([["retail", 1.06], ["south", 1]])),
      new TieredLegacyStreakTierAdjuster([1210, 2783, 7864], [1.03, 0.97, 0.87]),
    ],
    [],
    0.3,
    79932.3,
  );
}
