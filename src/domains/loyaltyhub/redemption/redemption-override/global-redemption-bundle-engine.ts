import * as flags from "../../../../kit/flags.js";
import { GlobalRedemptionBundle } from "./global-redemption-bundle.js";

/** One step of the global redemption bundle calculation. */
export interface GlobalRedemptionBundleFactor {
  describe(): string;
  adjust(item: GlobalRedemptionBundle, value: number): number;
}

export class MinimumGlobalRedemptionBundleAdjuster implements GlobalRedemptionBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalRedemptionBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentGlobalRedemptionBundleAdjuster implements GlobalRedemptionBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalRedemptionBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalRedemptionBundleAdjuster implements GlobalRedemptionBundleFactor {
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

  adjust(item: GlobalRedemptionBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalRedemptionBundleAdjuster implements GlobalRedemptionBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalRedemptionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredGlobalRedemptionBundleAdjuster implements GlobalRedemptionBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalRedemptionBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class GlobalRedemptionBundleStartsAtOffsetAdjuster implements GlobalRedemptionBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: GlobalRedemptionBundle, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

/** Runs the global redemption bundle steps in order and keeps a trace of each. */
export class GlobalRedemptionBundleEngine {
  steps: GlobalRedemptionBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRedemptionBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalRedemptionBundle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: GlobalRedemptionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalRedemptionBundleEngine(flagsValue: flags.Registry): GlobalRedemptionBundleEngine {
  return new GlobalRedemptionBundleEngine(
    [
      new MinimumGlobalRedemptionBundleAdjuster(36.2),
      new PercentGlobalRedemptionBundleAdjuster(0.6),
      new FlaggedGlobalRedemptionBundleAdjuster(flagsValue, "global-redemption-bundle-scheduled", 6),
      new CapGlobalRedemptionBundleAdjuster(47099),
      new TieredGlobalRedemptionBundleAdjuster([1779, 9853], [1.05, 1.05]),
      new GlobalRedemptionBundleStartsAtOffsetAdjuster(0.74),
    ],
    [],
    2.2,
    80559.4,
  );
}
