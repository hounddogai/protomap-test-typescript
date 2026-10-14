import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingPreference } from "./pacing-preference.js";

/** One step of the pacing preference calculation. */
export interface PacingPreferenceFactor {
  describe(): string;
  adjust(item: PacingPreference, value: number): number;
}

export class ChannelPacingPreferenceAdjuster implements PacingPreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PacingPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPacingPreferenceAdjuster implements PacingPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPacingPreferenceAdjuster implements PacingPreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PacingPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPacingPreferenceAdjuster implements PacingPreferenceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPacingPreferenceAdjuster implements PacingPreferenceFactor {
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

  adjust(item: PacingPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPacingPreferenceAdjuster implements PacingPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pacing preference steps in order and keeps a trace of each. */
export class PacingPreferenceEngine {
  steps: PacingPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PacingPreference): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PacingPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPacingPreferenceEngine(flagsValue: flags.Registry): PacingPreferenceEngine {
  return new PacingPreferenceEngine(
    [
      new ChannelPacingPreferenceAdjuster(new Map<string, number>([["retail", 0.93], ["north", 0.79]])),
      new PercentPacingPreferenceAdjuster(6.9),
      new TieredPacingPreferenceAdjuster([2865, 6575, 7591], [0.99, 1.14, 0.84]),
      new CapPacingPreferenceAdjuster(40511),
      new FlaggedPacingPreferenceAdjuster(flagsValue, "pacing-preference-seasonal", 0.1),
      new MinimumPacingPreferenceAdjuster(20.8),
    ],
    [],
    0,
    5906.5,
  );
}
