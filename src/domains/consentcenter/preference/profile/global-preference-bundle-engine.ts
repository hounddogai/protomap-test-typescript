import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalPreferenceBundle } from "./global-preference-bundle.js";

/** One step of the global preference bundle calculation. */
export interface GlobalPreferenceBundleAdjuster {
  describe(): string;
  adjust(item: GlobalPreferenceBundle, value: number): number;
}

export class CapGlobalPreferenceBundleAdjuster implements GlobalPreferenceBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalPreferenceBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedGlobalPreferenceBundleAdjuster implements GlobalPreferenceBundleAdjuster {
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

  adjust(item: GlobalPreferenceBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalPreferenceBundleAdjuster implements GlobalPreferenceBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalPreferenceBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentGlobalPreferenceBundleAdjuster implements GlobalPreferenceBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalPreferenceBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalPreferenceBundleAdjuster implements GlobalPreferenceBundleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalPreferenceBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class GlobalPreferenceBundleQuantityOffsetAdjuster implements GlobalPreferenceBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: GlobalPreferenceBundle, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the global preference bundle steps in order and keeps a trace of each. */
export class GlobalPreferenceBundleEngine {
  steps: GlobalPreferenceBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPreferenceBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalPreferenceBundle): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: GlobalPreferenceBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalPreferenceBundleEngine(flagsValue: flags.Registry): GlobalPreferenceBundleEngine {
  return new GlobalPreferenceBundleEngine(
    [
      new CapGlobalPreferenceBundleAdjuster(43202),
      new FlaggedGlobalPreferenceBundleAdjuster(flagsValue, "global-preference-bundle-tiered", 8.2),
      new MinimumGlobalPreferenceBundleAdjuster(49.8),
      new PercentGlobalPreferenceBundleAdjuster(17.4),
      new RoundingGlobalPreferenceBundleAdjuster(0.05),
      new GlobalPreferenceBundleQuantityOffsetAdjuster(1.93),
    ],
    [],
    4.1,
    20334.1,
  );
}
