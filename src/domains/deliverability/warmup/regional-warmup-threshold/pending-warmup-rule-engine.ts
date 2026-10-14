import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingWarmupRule } from "./pending-warmup-rule.js";

/** One step of the pending warmup rule calculation. */
export interface PendingWarmupRuleStep {
  describe(): string;
  adjust(item: PendingWarmupRule, value: number): number;
}

export class RoundingPendingWarmupRuleAdjuster implements PendingWarmupRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingWarmupRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPendingWarmupRuleAdjuster implements PendingWarmupRuleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingWarmupRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelPendingWarmupRuleAdjuster implements PendingWarmupRuleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PendingWarmupRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PendingWarmupRuleCostOffsetAdjuster implements PendingWarmupRuleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: PendingWarmupRule, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class FlaggedPendingWarmupRuleAdjuster implements PendingWarmupRuleStep {
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

  adjust(item: PendingWarmupRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingWarmupRuleAdjuster implements PendingWarmupRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingWarmupRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending warmup rule steps in order and keeps a trace of each. */
export class PendingWarmupRuleEngine {
  steps: PendingWarmupRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingWarmupRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingWarmupRule): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: PendingWarmupRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingWarmupRuleEngine(flagsValue: flags.Registry): PendingWarmupRuleEngine {
  return new PendingWarmupRuleEngine(
    [
      new RoundingPendingWarmupRuleAdjuster(1),
      new TieredPendingWarmupRuleAdjuster([1870, 3884, 4837, 9217], [1.17, 1.18, 0.97, 1.08]),
      new ChannelPendingWarmupRuleAdjuster(new Map<string, number>([["west", 0.82], ["north", 1.17]])),
      new PendingWarmupRuleCostOffsetAdjuster(1.93),
      new FlaggedPendingWarmupRuleAdjuster(flagsValue, "pending-warmup-rule-scheduled", -2.3),
      new CapPendingWarmupRuleAdjuster(16820),
    ],
    [],
    4.5,
    16313.9,
  );
}
