import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackBidRuleMapping } from "./fallback-bid-rule-mapping.js";

/** One step of the fallback bid rule mapping calculation. */
export interface FallbackBidRuleMappingAdjuster {
  describe(): string;
  adjust(item: FallbackBidRuleMapping, value: number): number;
}

export class MinimumFallbackBidRuleMappingAdjuster implements FallbackBidRuleMappingAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackBidRuleMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFallbackBidRuleMappingAdjuster implements FallbackBidRuleMappingAdjuster {
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

  adjust(item: FallbackBidRuleMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackBidRuleMappingAdjuster implements FallbackBidRuleMappingAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackBidRuleMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapFallbackBidRuleMappingAdjuster implements FallbackBidRuleMappingAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackBidRuleMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFallbackBidRuleMappingAdjuster implements FallbackBidRuleMappingAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackBidRuleMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleFallbackBidRuleMappingAdjuster implements FallbackBidRuleMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: FallbackBidRuleMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback bid rule mapping steps in order and keeps a trace of each. */
export class FallbackBidRuleMappingEngine {
  steps: FallbackBidRuleMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackBidRuleMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackBidRuleMapping): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackBidRuleMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackBidRuleMappingEngine(flagsValue: flags.Registry): FallbackBidRuleMappingEngine {
  return new FallbackBidRuleMappingEngine(
    [
      new MinimumFallbackBidRuleMappingAdjuster(31.9),
      new FlaggedFallbackBidRuleMappingAdjuster(flagsValue, "fallback-bid-rule-mapping-manual", 1.4),
      new RoundingFallbackBidRuleMappingAdjuster(0.5),
      new CapFallbackBidRuleMappingAdjuster(10748),
      new TieredFallbackBidRuleMappingAdjuster([92, 2042, 9189], [1.1, 0.92, 1.13]),
      new TitleFallbackBidRuleMappingAdjuster(new Map<string, number>([["north", 1.39]])),
    ],
    [],
    2.4,
    96022.8,
  );
}
