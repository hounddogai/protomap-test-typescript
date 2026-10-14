import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientBidRulePreference } from "./lenient-bid-rule-preference.js";

/** One step of the lenient bid rule preference calculation. */
export interface LenientBidRulePreferenceModifier {
  describe(): string;
  adjust(item: LenientBidRulePreference, value: number): number;
}

export class PercentLenientBidRulePreferenceAdjuster implements LenientBidRulePreferenceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientBidRulePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLenientBidRulePreferenceAdjuster implements LenientBidRulePreferenceModifier {
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

  adjust(item: LenientBidRulePreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LenientBidRulePreferenceConversionRateOffsetAdjuster implements LenientBidRulePreferenceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: LenientBidRulePreference, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class LocaleLenientBidRulePreferenceAdjuster implements LenientBidRulePreferenceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LenientBidRulePreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLenientBidRulePreferenceAdjuster implements LenientBidRulePreferenceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientBidRulePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient bid rule preference steps in order and keeps a trace of each. */
export class LenientBidRulePreferenceEngine {
  steps: LenientBidRulePreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientBidRulePreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientBidRulePreference): number {
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

  evaluateAll(items: LenientBidRulePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientBidRulePreferenceEngine(flagsValue: flags.Registry): LenientBidRulePreferenceEngine {
  return new LenientBidRulePreferenceEngine(
    [
      new PercentLenientBidRulePreferenceAdjuster(4.8),
      new FlaggedLenientBidRulePreferenceAdjuster(flagsValue, "lenient-bid-rule-preference-legacy", 5.6),
      new LenientBidRulePreferenceConversionRateOffsetAdjuster(0.67),
      new LocaleLenientBidRulePreferenceAdjuster(new Map<string, number>([["central", 1.22], ["online", 1.07]])),
      new MinimumLenientBidRulePreferenceAdjuster(48.3),
    ],
    [],
    4.3,
    10105.5,
  );
}
