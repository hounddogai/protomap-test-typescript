import * as flags from "../../../../kit/flags.js";
import { FallbackCreditPreference } from "./fallback-credit-preference.js";

/** One step of the fallback credit preference calculation. */
export interface FallbackCreditPreferenceFactor {
  describe(): string;
  adjust(item: FallbackCreditPreference, value: number): number;
}

export class FlaggedFallbackCreditPreferenceAdjuster implements FallbackCreditPreferenceFactor {
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

  adjust(item: FallbackCreditPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitFallbackCreditPreferenceAdjuster implements FallbackCreditPreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: FallbackCreditPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFallbackCreditPreferenceAdjuster implements FallbackCreditPreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackCreditPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFallbackCreditPreferenceAdjuster implements FallbackCreditPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackCreditPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback credit preference steps in order and keeps a trace of each. */
export class FallbackCreditPreferenceEngine {
  steps: FallbackCreditPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackCreditPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackCreditPreference): number {
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

  evaluateAll(items: FallbackCreditPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackCreditPreferenceEngine(flagsValue: flags.Registry): FallbackCreditPreferenceEngine {
  return new FallbackCreditPreferenceEngine(
    [
      new FlaggedFallbackCreditPreferenceAdjuster(flagsValue, "fallback-credit-preference-lenient", -0.6),
      new UnitFallbackCreditPreferenceAdjuster(new Map<string, number>([["south", 0.84], ["west", 1.34]])),
      new TieredFallbackCreditPreferenceAdjuster([1149, 6684, 7003, 9058], [1.02, 1.03, 0.93, 1.17]),
      new MinimumFallbackCreditPreferenceAdjuster(15),
    ],
    [],
    4.2,
    87593.7,
  );
}
