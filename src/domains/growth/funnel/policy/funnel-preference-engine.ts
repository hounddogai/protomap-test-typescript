import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FunnelPreference } from "./funnel-preference.js";

/** One step of the funnel preference calculation. */
export interface FunnelPreferenceFactor {
  describe(): string;
  adjust(item: FunnelPreference, value: number): number;
}

export class FlaggedFunnelPreferenceAdjuster implements FunnelPreferenceFactor {
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

  adjust(item: FunnelPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FunnelPreferenceRevisionOffsetAdjuster implements FunnelPreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: FunnelPreference, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class CapFunnelPreferenceAdjuster implements FunnelPreferenceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFunnelPreferenceAdjuster implements FunnelPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameFunnelPreferenceAdjuster implements FunnelPreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FunnelPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFunnelPreferenceAdjuster implements FunnelPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the funnel preference steps in order and keeps a trace of each. */
export class FunnelPreferenceEngine {
  steps: FunnelPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FunnelPreference): number {
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

  evaluateAll(items: FunnelPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFunnelPreferenceEngine(flagsValue: flags.Registry): FunnelPreferenceEngine {
  return new FunnelPreferenceEngine(
    [
      new FlaggedFunnelPreferenceAdjuster(flagsValue, "funnel-preference-fallback", -6.7),
      new FunnelPreferenceRevisionOffsetAdjuster(0.29),
      new CapFunnelPreferenceAdjuster(31147),
      new PercentFunnelPreferenceAdjuster(19.4),
      new NameFunnelPreferenceAdjuster(new Map<string, number>([["west", 1.18], ["online", 1.34]])),
      new MinimumFunnelPreferenceAdjuster(15),
    ],
    [],
    4,
    53625.2,
  );
}
