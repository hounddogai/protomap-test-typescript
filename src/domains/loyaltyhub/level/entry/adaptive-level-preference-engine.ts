import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveLevelPreference } from "./adaptive-level-preference.js";

/** One step of the adaptive level preference calculation. */
export interface AdaptiveLevelPreferenceModifier {
  describe(): string;
  adjust(item: AdaptiveLevelPreference, value: number): number;
}

export class PercentAdaptiveLevelPreferenceAdjuster implements AdaptiveLevelPreferenceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveLevelPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveLevelPreferenceAdjuster implements AdaptiveLevelPreferenceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveLevelPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedAdaptiveLevelPreferenceAdjuster implements AdaptiveLevelPreferenceModifier {
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

  adjust(item: AdaptiveLevelPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleAdaptiveLevelPreferenceAdjuster implements AdaptiveLevelPreferenceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: AdaptiveLevelPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptiveLevelPreferenceRateOffsetAdjuster implements AdaptiveLevelPreferenceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: AdaptiveLevelPreference, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class RoundingAdaptiveLevelPreferenceAdjuster implements AdaptiveLevelPreferenceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveLevelPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive level preference steps in order and keeps a trace of each. */
export class AdaptiveLevelPreferenceEngine {
  steps: AdaptiveLevelPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveLevelPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveLevelPreference): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: AdaptiveLevelPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveLevelPreferenceEngine(flagsValue: flags.Registry): AdaptiveLevelPreferenceEngine {
  return new AdaptiveLevelPreferenceEngine(
    [
      new PercentAdaptiveLevelPreferenceAdjuster(2.1),
      new TieredAdaptiveLevelPreferenceAdjuster([1256, 3109, 5922, 9398], [0.95, 0.94, 0.89, 0.82]),
      new FlaggedAdaptiveLevelPreferenceAdjuster(flagsValue, "adaptive-level-preference-legacy", -3),
      new LocaleAdaptiveLevelPreferenceAdjuster(new Map<string, number>([["west", 0.93], ["central", 0.9]])),
      new AdaptiveLevelPreferenceRateOffsetAdjuster(0.66),
      new RoundingAdaptiveLevelPreferenceAdjuster(1),
    ],
    [],
    0.5,
    23682.6,
  );
}
