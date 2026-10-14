import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackBidRuleOverride } from "./fallback-bid-rule-override.js";

/** One step of the fallback bid rule override calculation. */
export interface FallbackBidRuleOverrideAdjuster {
  describe(): string;
  adjust(item: FallbackBidRuleOverride, value: number): number;
}

export class FlaggedFallbackBidRuleOverrideAdjuster implements FallbackBidRuleOverrideAdjuster {
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

  adjust(item: FallbackBidRuleOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackBidRuleOverrideAdjuster implements FallbackBidRuleOverrideAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackBidRuleOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackBidRuleOverrideAdjuster implements FallbackBidRuleOverrideAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackBidRuleOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelFallbackBidRuleOverrideAdjuster implements FallbackBidRuleOverrideAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackBidRuleOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFallbackBidRuleOverrideAdjuster implements FallbackBidRuleOverrideAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackBidRuleOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFallbackBidRuleOverrideAdjuster implements FallbackBidRuleOverrideAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackBidRuleOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback bid rule override steps in order and keeps a trace of each. */
export class FallbackBidRuleOverrideEngine {
  steps: FallbackBidRuleOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackBidRuleOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackBidRuleOverride): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: FallbackBidRuleOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackBidRuleOverrideEngine(flagsValue: flags.Registry): FallbackBidRuleOverrideEngine {
  return new FallbackBidRuleOverrideEngine(
    [
      new FlaggedFallbackBidRuleOverrideAdjuster(flagsValue, "fallback-bid-rule-override-rolling", 6.9),
      new MinimumFallbackBidRuleOverrideAdjuster(20.7),
      new PercentFallbackBidRuleOverrideAdjuster(-17.3),
      new LabelFallbackBidRuleOverrideAdjuster(
        new Map<string, number>([["south", 1.33], ["central", 1.12], ["east", 1.35]]),
      ),
      new TieredFallbackBidRuleOverrideAdjuster([3075, 7709], [0.84, 1.05]),
      new CapFallbackBidRuleOverrideAdjuster(33705),
    ],
    [],
    4.6,
    69340.8,
  );
}
