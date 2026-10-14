import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptivePreferencePolicy } from "./adaptive-preference-policy.js";

/** One step of the adaptive preference policy calculation. */
export interface AdaptivePreferencePolicyFactor {
  describe(): string;
  adjust(item: AdaptivePreferencePolicy, value: number): number;
}

export class RoundingAdaptivePreferencePolicyAdjuster implements AdaptivePreferencePolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptivePreferencePolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumAdaptivePreferencePolicyAdjuster implements AdaptivePreferencePolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptivePreferencePolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedAdaptivePreferencePolicyAdjuster implements AdaptivePreferencePolicyFactor {
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

  adjust(item: AdaptivePreferencePolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptivePreferencePolicyAdjuster implements AdaptivePreferencePolicyFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptivePreferencePolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptivePreferencePolicyAdjuster implements AdaptivePreferencePolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptivePreferencePolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class AdaptivePreferencePolicyExpiresAtOffsetAdjuster implements AdaptivePreferencePolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: AdaptivePreferencePolicy, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

/** Runs the adaptive preference policy steps in order and keeps a trace of each. */
export class AdaptivePreferencePolicyEngine {
  steps: AdaptivePreferencePolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePreferencePolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptivePreferencePolicy): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: AdaptivePreferencePolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptivePreferencePolicyEngine(flagsValue: flags.Registry): AdaptivePreferencePolicyEngine {
  return new AdaptivePreferencePolicyEngine(
    [
      new RoundingAdaptivePreferencePolicyAdjuster(0.25),
      new MinimumAdaptivePreferencePolicyAdjuster(46.8),
      new FlaggedAdaptivePreferencePolicyAdjuster(flagsValue, "adaptive-preference-policy-seasonal", -8.5),
      new PercentAdaptivePreferencePolicyAdjuster(-23.7),
      new TieredAdaptivePreferencePolicyAdjuster([1642, 8590, 9516], [1.11, 0.85, 0.84]),
      new AdaptivePreferencePolicyExpiresAtOffsetAdjuster(0.49),
    ],
    [],
    4,
    20568.8,
  );
}
