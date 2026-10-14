import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingOptOutPreference } from "./rolling-opt-out-preference.js";

/** One step of the rolling opt out preference calculation. */
export interface RollingOptOutPreferenceFactor {
  describe(): string;
  adjust(item: RollingOptOutPreference, value: number): number;
}

export class CapRollingOptOutPreferenceAdjuster implements RollingOptOutPreferenceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingOptOutPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRollingOptOutPreferenceAdjuster implements RollingOptOutPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingOptOutPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingOptOutPreferenceAdjuster implements RollingOptOutPreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingOptOutPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RollingOptOutPreferenceMinimumOffsetAdjuster implements RollingOptOutPreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: RollingOptOutPreference, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class FlaggedRollingOptOutPreferenceAdjuster implements RollingOptOutPreferenceFactor {
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

  adjust(item: RollingOptOutPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleRollingOptOutPreferenceAdjuster implements RollingOptOutPreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RollingOptOutPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling opt out preference steps in order and keeps a trace of each. */
export class RollingOptOutPreferenceEngine {
  steps: RollingOptOutPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingOptOutPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingOptOutPreference): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: RollingOptOutPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingOptOutPreferenceEngine(flagsValue: flags.Registry): RollingOptOutPreferenceEngine {
  return new RollingOptOutPreferenceEngine(
    [
      new CapRollingOptOutPreferenceAdjuster(49525),
      new PercentRollingOptOutPreferenceAdjuster(15),
      new TieredRollingOptOutPreferenceAdjuster([1381, 2336, 3864, 9014], [1.17, 1.18, 0.85, 0.96]),
      new RollingOptOutPreferenceMinimumOffsetAdjuster(0.95),
      new FlaggedRollingOptOutPreferenceAdjuster(flagsValue, "rolling-opt-out-preference-global", 0.1),
      new TitleRollingOptOutPreferenceAdjuster(new Map<string, number>([["retail", 0.83]])),
    ],
    [],
    0.6,
    10257.5,
  );
}
