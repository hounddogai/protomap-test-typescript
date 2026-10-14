import * as flags from "../../../../kit/flags.js";
import { TieredDeflectionTier } from "./tiered-deflection-tier.js";

/** One step of the tiered deflection tier calculation. */
export interface TieredDeflectionTierFactor {
  describe(): string;
  adjust(item: TieredDeflectionTier, value: number): number;
}

export class TieredDeflectionTierDurationMinutesOffsetAdjuster implements TieredDeflectionTierFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: TieredDeflectionTier, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class FlaggedTieredDeflectionTierAdjuster implements TieredDeflectionTierFactor {
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

  adjust(item: TieredDeflectionTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredDeflectionTierAdjuster implements TieredDeflectionTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredDeflectionTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelTieredDeflectionTierAdjuster implements TieredDeflectionTierFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredDeflectionTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered deflection tier steps in order and keeps a trace of each. */
export class TieredDeflectionTierEngine {
  steps: TieredDeflectionTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredDeflectionTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredDeflectionTier): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: TieredDeflectionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredDeflectionTierEngine(flagsValue: flags.Registry): TieredDeflectionTierEngine {
  return new TieredDeflectionTierEngine(
    [
      new TieredDeflectionTierDurationMinutesOffsetAdjuster(0.98),
      new FlaggedTieredDeflectionTierAdjuster(flagsValue, "tiered-deflection-tier-legacy", 4),
      new CapTieredDeflectionTierAdjuster(20902),
      new LabelTieredDeflectionTierAdjuster(new Map<string, number>([["central", 1.32]])),
    ],
    [],
    1.5,
    49271.3,
  );
}
