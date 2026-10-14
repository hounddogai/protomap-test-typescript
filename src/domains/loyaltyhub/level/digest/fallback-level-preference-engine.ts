import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackLevelPreference } from "./fallback-level-preference.js";

/** One step of the fallback level preference calculation. */
export interface FallbackLevelPreferenceAdjuster {
  describe(): string;
  adjust(item: FallbackLevelPreference, value: number): number;
}

export class PercentFallbackLevelPreferenceAdjuster implements FallbackLevelPreferenceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackLevelPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackLevelPreferenceAdjuster implements FallbackLevelPreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackLevelPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFallbackLevelPreferenceAdjuster implements FallbackLevelPreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackLevelPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFallbackLevelPreferenceAdjuster implements FallbackLevelPreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackLevelPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackLevelPreferenceAdjuster implements FallbackLevelPreferenceAdjuster {
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

  adjust(item: FallbackLevelPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FallbackLevelPreferenceWindowDaysOffsetAdjuster implements FallbackLevelPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: FallbackLevelPreference, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the fallback level preference steps in order and keeps a trace of each. */
export class FallbackLevelPreferenceEngine {
  steps: FallbackLevelPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackLevelPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackLevelPreference): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: FallbackLevelPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackLevelPreferenceEngine(flagsValue: flags.Registry): FallbackLevelPreferenceEngine {
  return new FallbackLevelPreferenceEngine(
    [
      new PercentFallbackLevelPreferenceAdjuster(11.5),
      new CapFallbackLevelPreferenceAdjuster(11520),
      new MinimumFallbackLevelPreferenceAdjuster(3.2),
      new TieredFallbackLevelPreferenceAdjuster([1173, 5062, 5707], [1.16, 0.92, 1.13]),
      new FlaggedFallbackLevelPreferenceAdjuster(flagsValue, "fallback-level-preference-pending", 7.3),
      new FallbackLevelPreferenceWindowDaysOffsetAdjuster(1.63),
    ],
    [],
    0.1,
    16097.5,
  );
}
