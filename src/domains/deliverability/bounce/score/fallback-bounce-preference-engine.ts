import * as flags from "../../../../kit/flags.js";
import { FallbackBouncePreference } from "./fallback-bounce-preference.js";

/** One step of the fallback bounce preference calculation. */
export interface FallbackBouncePreferenceFactor {
  describe(): string;
  adjust(item: FallbackBouncePreference, value: number): number;
}

export class FallbackBouncePreferenceAttemptsOffsetAdjuster implements FallbackBouncePreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: FallbackBouncePreference, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class CapFallbackBouncePreferenceAdjuster implements FallbackBouncePreferenceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackBouncePreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFallbackBouncePreferenceAdjuster implements FallbackBouncePreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackBouncePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFallbackBouncePreferenceAdjuster implements FallbackBouncePreferenceFactor {
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

  adjust(item: FallbackBouncePreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackBouncePreferenceAdjuster implements FallbackBouncePreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackBouncePreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback bounce preference steps in order and keeps a trace of each. */
export class FallbackBouncePreferenceEngine {
  steps: FallbackBouncePreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackBouncePreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackBouncePreference): number {
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

  evaluateAll(items: FallbackBouncePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackBouncePreferenceEngine(flagsValue: flags.Registry): FallbackBouncePreferenceEngine {
  return new FallbackBouncePreferenceEngine(
    [
      new FallbackBouncePreferenceAttemptsOffsetAdjuster(1.85),
      new CapFallbackBouncePreferenceAdjuster(33904),
      new PercentFallbackBouncePreferenceAdjuster(15.1),
      new FlaggedFallbackBouncePreferenceAdjuster(flagsValue, "fallback-bounce-preference-batched", 1.9),
      new TieredFallbackBouncePreferenceAdjuster([1434, 1805, 7703], [0.99, 0.83, 0.87]),
    ],
    [],
    0.1,
    69769.9,
  );
}
