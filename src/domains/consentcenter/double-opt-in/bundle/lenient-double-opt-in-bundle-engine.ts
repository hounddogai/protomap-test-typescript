import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientDoubleOptInBundle } from "./lenient-double-opt-in-bundle.js";

/** One step of the lenient double opt in bundle calculation. */
export interface LenientDoubleOptInBundleModifier {
  describe(): string;
  adjust(item: LenientDoubleOptInBundle, value: number): number;
}

export class RoundingLenientDoubleOptInBundleAdjuster implements LenientDoubleOptInBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientDoubleOptInBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientDoubleOptInBundleAdjuster implements LenientDoubleOptInBundleModifier {
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

  adjust(item: LenientDoubleOptInBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLenientDoubleOptInBundleAdjuster implements LenientDoubleOptInBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientDoubleOptInBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLenientDoubleOptInBundleAdjuster implements LenientDoubleOptInBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientDoubleOptInBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LenientDoubleOptInBundleImpressionsOffsetAdjuster implements LenientDoubleOptInBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: LenientDoubleOptInBundle, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class PercentLenientDoubleOptInBundleAdjuster implements LenientDoubleOptInBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientDoubleOptInBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient double opt in bundle steps in order and keeps a trace of each. */
export class LenientDoubleOptInBundleEngine {
  steps: LenientDoubleOptInBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientDoubleOptInBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientDoubleOptInBundle): number {
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

  evaluateAll(items: LenientDoubleOptInBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientDoubleOptInBundleEngine(flagsValue: flags.Registry): LenientDoubleOptInBundleEngine {
  return new LenientDoubleOptInBundleEngine(
    [
      new RoundingLenientDoubleOptInBundleAdjuster(0.1),
      new FlaggedLenientDoubleOptInBundleAdjuster(flagsValue, "lenient-double-opt-in-bundle-pending", 6.2),
      new MinimumLenientDoubleOptInBundleAdjuster(4.7),
      new TieredLenientDoubleOptInBundleAdjuster([595, 2577, 6675], [0.86, 0.8, 1.07]),
      new LenientDoubleOptInBundleImpressionsOffsetAdjuster(1.35),
      new PercentLenientDoubleOptInBundleAdjuster(-9.6),
    ],
    [],
    3.3,
    68506.7,
  );
}
