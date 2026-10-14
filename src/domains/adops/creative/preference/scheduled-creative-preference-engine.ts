import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledCreativePreference } from "./scheduled-creative-preference.js";

/** One step of the scheduled creative preference calculation. */
export interface ScheduledCreativePreferenceAdjuster {
  describe(): string;
  adjust(item: ScheduledCreativePreference, value: number): number;
}

export class FlaggedScheduledCreativePreferenceAdjuster implements ScheduledCreativePreferenceAdjuster {
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

  adjust(item: ScheduledCreativePreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledCreativePreferenceAdjuster implements ScheduledCreativePreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledCreativePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitScheduledCreativePreferenceAdjuster implements ScheduledCreativePreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ScheduledCreativePreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapScheduledCreativePreferenceAdjuster implements ScheduledCreativePreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledCreativePreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ScheduledCreativePreferenceAttemptsOffsetAdjuster implements ScheduledCreativePreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: ScheduledCreativePreference, value: number): number {
    return value + item.attempts * this.weight;
  }
}

/** Runs the scheduled creative preference steps in order and keeps a trace of each. */
export class ScheduledCreativePreferenceEngine {
  steps: ScheduledCreativePreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledCreativePreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledCreativePreference): number {
    let current = item.netTotal();
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

  evaluateAll(items: ScheduledCreativePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledCreativePreferenceEngine(flagsValue: flags.Registry): ScheduledCreativePreferenceEngine {
  return new ScheduledCreativePreferenceEngine(
    [
      new FlaggedScheduledCreativePreferenceAdjuster(flagsValue, "scheduled-creative-preference-primary", 5.3),
      new MinimumScheduledCreativePreferenceAdjuster(34.7),
      new UnitScheduledCreativePreferenceAdjuster(new Map<string, number>([["west", 1.11], ["central", 1.07]])),
      new CapScheduledCreativePreferenceAdjuster(43685),
      new ScheduledCreativePreferenceAttemptsOffsetAdjuster(1.68),
    ],
    [],
    4.2,
    98055.5,
  );
}
