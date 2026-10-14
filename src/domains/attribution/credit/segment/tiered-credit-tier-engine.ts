import * as flags from "../../../../kit/flags.js";
import { TieredCreditTier } from "./tiered-credit-tier.js";

/** One step of the tiered credit tier calculation. */
export interface TieredCreditTierModifier {
  describe(): string;
  adjust(item: TieredCreditTier, value: number): number;
}

export class NameTieredCreditTierAdjuster implements TieredCreditTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TieredCreditTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredCreditTierAdjuster implements TieredCreditTierModifier {
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

  adjust(item: TieredCreditTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCreditTierMarginOffsetAdjuster implements TieredCreditTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: TieredCreditTier, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class CapTieredCreditTierAdjuster implements TieredCreditTierModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredCreditTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered credit tier steps in order and keeps a trace of each. */
export class TieredCreditTierEngine {
  steps: TieredCreditTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredCreditTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredCreditTier): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: TieredCreditTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredCreditTierEngine(flagsValue: flags.Registry): TieredCreditTierEngine {
  return new TieredCreditTierEngine(
    [
      new NameTieredCreditTierAdjuster(
        new Map<string, number>([["retail", 1.14], ["south", 1.27], ["north", 0.77]]),
      ),
      new FlaggedTieredCreditTierAdjuster(flagsValue, "tiered-credit-tier-capped", -3.8),
      new TieredCreditTierMarginOffsetAdjuster(1.95),
      new CapTieredCreditTierAdjuster(33845),
    ],
    [],
    1.9,
    16412.7,
  );
}
