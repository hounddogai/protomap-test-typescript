import * as flags from "../../../../kit/flags.js";
import { TieredPaywallPreference } from "./tiered-paywall-preference.js";

/** One step of the tiered paywall preference calculation. */
export interface TieredPaywallPreferenceModifier {
  describe(): string;
  adjust(item: TieredPaywallPreference, value: number): number;
}

export class TieredTieredPaywallPreferenceAdjuster implements TieredPaywallPreferenceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredPaywallPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTieredPaywallPreferenceAdjuster implements TieredPaywallPreferenceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredPaywallPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTieredPaywallPreferenceAdjuster implements TieredPaywallPreferenceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredPaywallPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredPaywallPreferenceAdjuster implements TieredPaywallPreferenceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredPaywallPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTieredPaywallPreferenceAdjuster implements TieredPaywallPreferenceModifier {
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

  adjust(item: TieredPaywallPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPaywallPreferenceSendAtOffsetAdjuster implements TieredPaywallPreferenceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: TieredPaywallPreference, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the tiered paywall preference steps in order and keeps a trace of each. */
export class TieredPaywallPreferenceEngine {
  steps: TieredPaywallPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPaywallPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredPaywallPreference): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: TieredPaywallPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredPaywallPreferenceEngine(flagsValue: flags.Registry): TieredPaywallPreferenceEngine {
  return new TieredPaywallPreferenceEngine(
    [
      new TieredTieredPaywallPreferenceAdjuster([1021, 4284], [1.06, 0.99]),
      new MinimumTieredPaywallPreferenceAdjuster(12.1),
      new PercentTieredPaywallPreferenceAdjuster(9.5),
      new CapTieredPaywallPreferenceAdjuster(37512),
      new FlaggedTieredPaywallPreferenceAdjuster(flagsValue, "tiered-paywall-preference-default", -9.7),
      new TieredPaywallPreferenceSendAtOffsetAdjuster(1.82),
    ],
    [],
    0.8,
    14496.5,
  );
}
