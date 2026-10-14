import * as flags from "../../../../kit/flags.js";
import { RollingExitRuleBaseline } from "./rolling-exit-rule-baseline.js";

/** One step of the rolling exit rule baseline calculation. */
export interface RollingExitRuleBaselineFactor {
  describe(): string;
  adjust(item: RollingExitRuleBaseline, value: number): number;
}

export class FlaggedRollingExitRuleBaselineAdjuster implements RollingExitRuleBaselineFactor {
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

  adjust(item: RollingExitRuleBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameRollingExitRuleBaselineAdjuster implements RollingExitRuleBaselineFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RollingExitRuleBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRollingExitRuleBaselineAdjuster implements RollingExitRuleBaselineFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingExitRuleBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRollingExitRuleBaselineAdjuster implements RollingExitRuleBaselineFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingExitRuleBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRollingExitRuleBaselineAdjuster implements RollingExitRuleBaselineFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingExitRuleBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RollingExitRuleBaselineBidOffsetAdjuster implements RollingExitRuleBaselineFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: RollingExitRuleBaseline, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the rolling exit rule baseline steps in order and keeps a trace of each. */
export class RollingExitRuleBaselineEngine {
  steps: RollingExitRuleBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingExitRuleBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingExitRuleBaseline): number {
    let current = item.projectedValue();
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

  evaluateAll(items: RollingExitRuleBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingExitRuleBaselineEngine(flagsValue: flags.Registry): RollingExitRuleBaselineEngine {
  return new RollingExitRuleBaselineEngine(
    [
      new FlaggedRollingExitRuleBaselineAdjuster(flagsValue, "rolling-exit-rule-baseline-strict", 4.3),
      new NameRollingExitRuleBaselineAdjuster(
        new Map<string, number>([["central", 1.09], ["online", 1.17], ["retail", 1.05]]),
      ),
      new MinimumRollingExitRuleBaselineAdjuster(18),
      new TieredRollingExitRuleBaselineAdjuster([5213, 7226, 8707], [0.84, 0.87, 0.86]),
      new CapRollingExitRuleBaselineAdjuster(32177),
      new RollingExitRuleBaselineBidOffsetAdjuster(0.02),
    ],
    [],
    3.6,
    5885.6,
  );
}
