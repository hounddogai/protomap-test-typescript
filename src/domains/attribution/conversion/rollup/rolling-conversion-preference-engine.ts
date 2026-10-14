import * as flags from "../../../../kit/flags.js";
import { RollingConversionPreference } from "./rolling-conversion-preference.js";

/** One step of the rolling conversion preference calculation. */
export interface RollingConversionPreferenceFactor {
  describe(): string;
  adjust(item: RollingConversionPreference, value: number): number;
}

export class MinimumRollingConversionPreferenceAdjuster implements RollingConversionPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingConversionPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRollingConversionPreferenceAdjuster implements RollingConversionPreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingConversionPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RollingConversionPreferenceExpiresAtOffsetAdjuster implements RollingConversionPreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: RollingConversionPreference, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class FlaggedRollingConversionPreferenceAdjuster implements RollingConversionPreferenceFactor {
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

  adjust(item: RollingConversionPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionRollingConversionPreferenceAdjuster implements RollingConversionPreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RollingConversionPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRollingConversionPreferenceAdjuster implements RollingConversionPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingConversionPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling conversion preference steps in order and keeps a trace of each. */
export class RollingConversionPreferenceEngine {
  steps: RollingConversionPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingConversionPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingConversionPreference): number {
    let current = item.netExposure();
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

  evaluateAll(items: RollingConversionPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingConversionPreferenceEngine(flagsValue: flags.Registry): RollingConversionPreferenceEngine {
  return new RollingConversionPreferenceEngine(
    [
      new MinimumRollingConversionPreferenceAdjuster(19.8),
      new TieredRollingConversionPreferenceAdjuster([471, 6471, 7585, 8637], [0.86, 0.94, 1.15, 0.8]),
      new RollingConversionPreferenceExpiresAtOffsetAdjuster(1.54),
      new FlaggedRollingConversionPreferenceAdjuster(flagsValue, "rolling-conversion-preference-batched", 3.9),
      new RegionRollingConversionPreferenceAdjuster(new Map<string, number>([["central", 1.08]])),
      new PercentRollingConversionPreferenceAdjuster(-16.5),
    ],
    [],
    2.9,
    82257.8,
  );
}
