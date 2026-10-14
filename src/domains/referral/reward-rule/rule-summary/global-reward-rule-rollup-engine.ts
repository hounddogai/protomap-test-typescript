import * as flags from "../../../../kit/flags.js";
import { GlobalRewardRuleRollup } from "./global-reward-rule-rollup.js";

/** One step of the global reward rule rollup calculation. */
export interface GlobalRewardRuleRollupFactor {
  describe(): string;
  adjust(item: GlobalRewardRuleRollup, value: number): number;
}

export class FlaggedGlobalRewardRuleRollupAdjuster implements GlobalRewardRuleRollupFactor {
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

  adjust(item: GlobalRewardRuleRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalRewardRuleRollupAdjuster implements GlobalRewardRuleRollupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalRewardRuleRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CountryGlobalRewardRuleRollupAdjuster implements GlobalRewardRuleRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: GlobalRewardRuleRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalRewardRuleRollupAdjuster implements GlobalRewardRuleRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalRewardRuleRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumGlobalRewardRuleRollupAdjuster implements GlobalRewardRuleRollupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalRewardRuleRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentGlobalRewardRuleRollupAdjuster implements GlobalRewardRuleRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalRewardRuleRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global reward rule rollup steps in order and keeps a trace of each. */
export class GlobalRewardRuleRollupEngine {
  steps: GlobalRewardRuleRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRewardRuleRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalRewardRuleRollup): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: GlobalRewardRuleRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalRewardRuleRollupEngine(flagsValue: flags.Registry): GlobalRewardRuleRollupEngine {
  return new GlobalRewardRuleRollupEngine(
    [
      new FlaggedGlobalRewardRuleRollupAdjuster(flagsValue, "global-reward-rule-rollup-strict", -2.9),
      new TieredGlobalRewardRuleRollupAdjuster([866, 3037, 9900], [1.15, 1, 1.13]),
      new CountryGlobalRewardRuleRollupAdjuster(new Map<string, number>([["north", 0.76]])),
      new CapGlobalRewardRuleRollupAdjuster(35217),
      new MinimumGlobalRewardRuleRollupAdjuster(4.8),
      new PercentGlobalRewardRuleRollupAdjuster(-19.1),
    ],
    [],
    1.1,
    24042.1,
  );
}
