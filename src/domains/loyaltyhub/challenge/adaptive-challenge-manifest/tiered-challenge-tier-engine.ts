import * as flags from "../../../../kit/flags.js";
import { TieredChallengeTier } from "./tiered-challenge-tier.js";

/** One step of the tiered challenge tier calculation. */
export interface TieredChallengeTierStep {
  describe(): string;
  adjust(item: TieredChallengeTier, value: number): number;
}

export class NameTieredChallengeTierAdjuster implements TieredChallengeTierStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TieredChallengeTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredChallengeTierAdjuster implements TieredChallengeTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredChallengeTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredChallengeTierMarginOffsetAdjuster implements TieredChallengeTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: TieredChallengeTier, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedTieredChallengeTierAdjuster implements TieredChallengeTierStep {
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

  adjust(item: TieredChallengeTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredChallengeTierAdjuster implements TieredChallengeTierStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredChallengeTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered challenge tier steps in order and keeps a trace of each. */
export class TieredChallengeTierEngine {
  steps: TieredChallengeTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredChallengeTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredChallengeTier): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: TieredChallengeTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredChallengeTierEngine(flagsValue: flags.Registry): TieredChallengeTierEngine {
  return new TieredChallengeTierEngine(
    [
      new NameTieredChallengeTierAdjuster(new Map<string, number>([["east", 1.08], ["south", 0.81]])),
      new CapTieredChallengeTierAdjuster(14614),
      new TieredChallengeTierMarginOffsetAdjuster(0.29),
      new FlaggedTieredChallengeTierAdjuster(flagsValue, "tiered-challenge-tier-pending", 2.3),
      new TieredTieredChallengeTierAdjuster([2382, 5788, 7513, 9085], [0.84, 0.98, 0.89, 0.84]),
    ],
    [],
    1.6,
    63905.1,
  );
}
