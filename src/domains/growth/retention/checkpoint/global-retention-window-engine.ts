import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalRetentionWindow } from "./global-retention-window.js";

/** One step of the global retention window calculation. */
export interface GlobalRetentionWindowFactor {
  describe(): string;
  adjust(item: GlobalRetentionWindow, value: number): number;
}

export class CapGlobalRetentionWindowAdjuster implements GlobalRetentionWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalRetentionWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryGlobalRetentionWindowAdjuster implements GlobalRetentionWindowFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: GlobalRetentionWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumGlobalRetentionWindowAdjuster implements GlobalRetentionWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalRetentionWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentGlobalRetentionWindowAdjuster implements GlobalRetentionWindowFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalRetentionWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalRetentionWindowAdjuster implements GlobalRetentionWindowFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalRetentionWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedGlobalRetentionWindowAdjuster implements GlobalRetentionWindowFactor {
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

  adjust(item: GlobalRetentionWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global retention window steps in order and keeps a trace of each. */
export class GlobalRetentionWindowEngine {
  steps: GlobalRetentionWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRetentionWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalRetentionWindow): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: GlobalRetentionWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalRetentionWindowEngine(flagsValue: flags.Registry): GlobalRetentionWindowEngine {
  return new GlobalRetentionWindowEngine(
    [
      new CapGlobalRetentionWindowAdjuster(14651),
      new CountryGlobalRetentionWindowAdjuster(new Map<string, number>([["north", 1.2], ["central", 0.71]])),
      new MinimumGlobalRetentionWindowAdjuster(48.7),
      new PercentGlobalRetentionWindowAdjuster(-13.5),
      new TieredGlobalRetentionWindowAdjuster([3095, 8423], [1.04, 1.01]),
      new FlaggedGlobalRetentionWindowAdjuster(flagsValue, "global-retention-window-primary", -2.8),
    ],
    [],
    3.1,
    80041.4,
  );
}
