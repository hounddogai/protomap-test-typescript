import * as flags from "../../../../kit/flags.js";
import { FallbackCreativePreference } from "./fallback-creative-preference.js";

/** One step of the fallback creative preference calculation. */
export interface FallbackCreativePreferenceStep {
  describe(): string;
  adjust(item: FallbackCreativePreference, value: number): number;
}

export class TieredFallbackCreativePreferenceAdjuster implements FallbackCreativePreferenceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackCreativePreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFallbackCreativePreferenceAdjuster implements FallbackCreativePreferenceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackCreativePreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFallbackCreativePreferenceAdjuster implements FallbackCreativePreferenceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackCreativePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FallbackCreativePreferenceRevisionOffsetAdjuster implements FallbackCreativePreferenceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: FallbackCreativePreference, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedFallbackCreativePreferenceAdjuster implements FallbackCreativePreferenceStep {
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

  adjust(item: FallbackCreativePreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback creative preference steps in order and keeps a trace of each. */
export class FallbackCreativePreferenceEngine {
  steps: FallbackCreativePreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackCreativePreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackCreativePreference): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: FallbackCreativePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackCreativePreferenceEngine(flagsValue: flags.Registry): FallbackCreativePreferenceEngine {
  return new FallbackCreativePreferenceEngine(
    [
      new TieredFallbackCreativePreferenceAdjuster([2540, 3326], [1.11, 1.2]),
      new CapFallbackCreativePreferenceAdjuster(7904),
      new PercentFallbackCreativePreferenceAdjuster(-4.5),
      new FallbackCreativePreferenceRevisionOffsetAdjuster(0.36),
      new FlaggedFallbackCreativePreferenceAdjuster(flagsValue, "fallback-creative-preference-weighted", -8.4),
    ],
    [],
    2.3,
    95820.4,
  );
}
