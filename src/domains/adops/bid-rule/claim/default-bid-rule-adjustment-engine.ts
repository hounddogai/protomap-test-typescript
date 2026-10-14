import * as flags from "../../../../kit/flags.js";
import { DefaultBidRuleAdjustment } from "./default-bid-rule-adjustment.js";

/** One step of the default bid rule adjustment calculation. */
export interface DefaultBidRuleAdjustmentFactor {
  describe(): string;
  adjust(item: DefaultBidRuleAdjustment, value: number): number;
}

export class DefaultBidRuleAdjustmentFrequencyCapOffsetAdjuster implements DefaultBidRuleAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: DefaultBidRuleAdjustment, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class NameDefaultBidRuleAdjustmentAdjuster implements DefaultBidRuleAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DefaultBidRuleAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDefaultBidRuleAdjustmentAdjuster implements DefaultBidRuleAdjustmentFactor {
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

  adjust(item: DefaultBidRuleAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDefaultBidRuleAdjustmentAdjuster implements DefaultBidRuleAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultBidRuleAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultBidRuleAdjustmentAdjuster implements DefaultBidRuleAdjustmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultBidRuleAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredDefaultBidRuleAdjustmentAdjuster implements DefaultBidRuleAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultBidRuleAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default bid rule adjustment steps in order and keeps a trace of each. */
export class DefaultBidRuleAdjustmentEngine {
  steps: DefaultBidRuleAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultBidRuleAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultBidRuleAdjustment): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: DefaultBidRuleAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultBidRuleAdjustmentEngine(flagsValue: flags.Registry): DefaultBidRuleAdjustmentEngine {
  return new DefaultBidRuleAdjustmentEngine(
    [
      new DefaultBidRuleAdjustmentFrequencyCapOffsetAdjuster(0.54),
      new NameDefaultBidRuleAdjustmentAdjuster(new Map<string, number>([["south", 1.28]])),
      new FlaggedDefaultBidRuleAdjustmentAdjuster(flagsValue, "default-bid-rule-adjustment-adaptive", 2.7),
      new PercentDefaultBidRuleAdjustmentAdjuster(19.2),
      new MinimumDefaultBidRuleAdjustmentAdjuster(39.9),
      new TieredDefaultBidRuleAdjustmentAdjuster([8368, 9815], [0.98, 0.93]),
    ],
    [],
    0.1,
    21553.8,
  );
}
