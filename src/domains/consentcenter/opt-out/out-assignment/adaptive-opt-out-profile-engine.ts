import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveOptOutProfile } from "./adaptive-opt-out-profile.js";

/** One step of the adaptive opt out profile calculation. */
export interface AdaptiveOptOutProfileFactor {
  describe(): string;
  adjust(item: AdaptiveOptOutProfile, value: number): number;
}

export class MinimumAdaptiveOptOutProfileAdjuster implements AdaptiveOptOutProfileFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveOptOutProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleAdaptiveOptOutProfileAdjuster implements AdaptiveOptOutProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: AdaptiveOptOutProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentAdaptiveOptOutProfileAdjuster implements AdaptiveOptOutProfileFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveOptOutProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedAdaptiveOptOutProfileAdjuster implements AdaptiveOptOutProfileFactor {
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

  adjust(item: AdaptiveOptOutProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class AdaptiveOptOutProfileThresholdOffsetAdjuster implements AdaptiveOptOutProfileFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: AdaptiveOptOutProfile, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RoundingAdaptiveOptOutProfileAdjuster implements AdaptiveOptOutProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveOptOutProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive opt out profile steps in order and keeps a trace of each. */
export class AdaptiveOptOutProfileEngine {
  steps: AdaptiveOptOutProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveOptOutProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveOptOutProfile): number {
    let current = item.netValue();
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

  evaluateAll(items: AdaptiveOptOutProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveOptOutProfileEngine(flagsValue: flags.Registry): AdaptiveOptOutProfileEngine {
  return new AdaptiveOptOutProfileEngine(
    [
      new MinimumAdaptiveOptOutProfileAdjuster(7.7),
      new LocaleAdaptiveOptOutProfileAdjuster(
        new Map<string, number>([["online", 1.02], ["central", 1.01], ["south", 1.07]]),
      ),
      new PercentAdaptiveOptOutProfileAdjuster(0.5),
      new FlaggedAdaptiveOptOutProfileAdjuster(flagsValue, "adaptive-opt-out-profile-pending", 4.6),
      new AdaptiveOptOutProfileThresholdOffsetAdjuster(0.56),
      new RoundingAdaptiveOptOutProfileAdjuster(5),
    ],
    [],
    0.2,
    96371.5,
  );
}
