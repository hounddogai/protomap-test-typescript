import * as flags from "../../../../kit/flags.js";
import { TieredStepTier } from "./tiered-step-tier.js";

/** One step of the tiered step tier calculation. */
export interface TieredStepTierModifier {
  describe(): string;
  adjust(item: TieredStepTier, value: number): number;
}

export class TieredTieredStepTierAdjuster implements TieredStepTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredStepTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentTieredStepTierAdjuster implements TieredStepTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredStepTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredStepTierAdjuster implements TieredStepTierModifier {
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

  adjust(item: TieredStepTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered step tier steps in order and keeps a trace of each. */
export class TieredStepTierEngine {
  steps: TieredStepTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredStepTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredStepTier): number {
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

  evaluateAll(items: TieredStepTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredStepTierEngine(flagsValue: flags.Registry): TieredStepTierEngine {
  return new TieredStepTierEngine(
    [
      new TieredTieredStepTierAdjuster([2068, 2088, 3811, 5934], [0.9, 1, 0.97, 1.04]),
      new PercentTieredStepTierAdjuster(5.8),
      new FlaggedTieredStepTierAdjuster(flagsValue, "tiered-step-tier-weighted", 9.2),
    ],
    [],
    2.6,
    28587.1,
  );
}
