import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RetentionPreference } from "./retention-preference.js";

/** One step of the retention preference calculation. */
export interface RetentionPreferenceFactor {
  describe(): string;
  adjust(item: RetentionPreference, value: number): number;
}

export class MinimumRetentionPreferenceAdjuster implements RetentionPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRetentionPreferenceAdjuster implements RetentionPreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRetentionPreferenceAdjuster implements RetentionPreferenceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RetentionPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRetentionPreferenceAdjuster implements RetentionPreferenceFactor {
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

  adjust(item: RetentionPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRetentionPreferenceAdjuster implements RetentionPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UnitRetentionPreferenceAdjuster implements RetentionPreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: RetentionPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the retention preference steps in order and keeps a trace of each. */
export class RetentionPreferenceEngine {
  steps: RetentionPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RetentionPreference): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: RetentionPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRetentionPreferenceEngine(flagsValue: flags.Registry): RetentionPreferenceEngine {
  return new RetentionPreferenceEngine(
    [
      new MinimumRetentionPreferenceAdjuster(7.9),
      new TieredRetentionPreferenceAdjuster([5937, 8000, 8160], [0.82, 0.91, 0.97]),
      new RoundingRetentionPreferenceAdjuster(0.05),
      new FlaggedRetentionPreferenceAdjuster(flagsValue, "retention-preference-weighted", -0.7),
      new PercentRetentionPreferenceAdjuster(15.7),
      new UnitRetentionPreferenceAdjuster(new Map<string, number>([["central", 0.91], ["retail", 0.81]])),
    ],
    [],
    3.7,
    33792.5,
  );
}
