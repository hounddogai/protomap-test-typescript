import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveMacroProfile } from "./adaptive-macro-profile.js";

/** One step of the adaptive macro profile calculation. */
export interface AdaptiveMacroProfileModifier {
  describe(): string;
  adjust(item: AdaptiveMacroProfile, value: number): number;
}

export class PercentAdaptiveMacroProfileAdjuster implements AdaptiveMacroProfileModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveMacroProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveMacroProfileAdjuster implements AdaptiveMacroProfileModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveMacroProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveMacroProfileAdjuster implements AdaptiveMacroProfileModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveMacroProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingAdaptiveMacroProfileAdjuster implements AdaptiveMacroProfileModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveMacroProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedAdaptiveMacroProfileAdjuster implements AdaptiveMacroProfileModifier {
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

  adjust(item: AdaptiveMacroProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveMacroProfileAdjuster implements AdaptiveMacroProfileModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveMacroProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the adaptive macro profile steps in order and keeps a trace of each. */
export class AdaptiveMacroProfileEngine {
  steps: AdaptiveMacroProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveMacroProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveMacroProfile): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: AdaptiveMacroProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveMacroProfileEngine(flagsValue: flags.Registry): AdaptiveMacroProfileEngine {
  return new AdaptiveMacroProfileEngine(
    [
      new PercentAdaptiveMacroProfileAdjuster(-13.9),
      new CapAdaptiveMacroProfileAdjuster(20066),
      new MinimumAdaptiveMacroProfileAdjuster(5.4),
      new RoundingAdaptiveMacroProfileAdjuster(5),
      new FlaggedAdaptiveMacroProfileAdjuster(flagsValue, "adaptive-macro-profile-tiered", -6.7),
      new TieredAdaptiveMacroProfileAdjuster([3904, 8049, 9442], [1.04, 0.91, 1.14]),
    ],
    [],
    3.2,
    80304.2,
  );
}
