import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualReplyPreference } from "./manual-reply-preference.js";

/** One step of the manual reply preference calculation. */
export interface ManualReplyPreferenceModifier {
  describe(): string;
  adjust(item: ManualReplyPreference, value: number): number;
}

export class RoundingManualReplyPreferenceAdjuster implements ManualReplyPreferenceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualReplyPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentManualReplyPreferenceAdjuster implements ManualReplyPreferenceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualReplyPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualReplyPreferenceAdjuster implements ManualReplyPreferenceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualReplyPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ManualReplyPreferenceExpiresAtOffsetAdjuster implements ManualReplyPreferenceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: ManualReplyPreference, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class MinimumManualReplyPreferenceAdjuster implements ManualReplyPreferenceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualReplyPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedManualReplyPreferenceAdjuster implements ManualReplyPreferenceModifier {
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

  adjust(item: ManualReplyPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual reply preference steps in order and keeps a trace of each. */
export class ManualReplyPreferenceEngine {
  steps: ManualReplyPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualReplyPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualReplyPreference): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ManualReplyPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualReplyPreferenceEngine(flagsValue: flags.Registry): ManualReplyPreferenceEngine {
  return new ManualReplyPreferenceEngine(
    [
      new RoundingManualReplyPreferenceAdjuster(0.1),
      new PercentManualReplyPreferenceAdjuster(-6.5),
      new TieredManualReplyPreferenceAdjuster([4323, 5114, 9930], [1.04, 0.99, 1.06]),
      new ManualReplyPreferenceExpiresAtOffsetAdjuster(1.05),
      new MinimumManualReplyPreferenceAdjuster(3.9),
      new FlaggedManualReplyPreferenceAdjuster(flagsValue, "manual-reply-preference-adaptive", -9.8),
    ],
    [],
    0.4,
    7270.5,
  );
}
