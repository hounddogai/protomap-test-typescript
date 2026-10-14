import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledNudgePreference } from "./scheduled-nudge-preference.js";

/** One step of the scheduled nudge preference calculation. */
export interface ScheduledNudgePreferenceStep {
  describe(): string;
  adjust(item: ScheduledNudgePreference, value: number): number;
}

export class FlaggedScheduledNudgePreferenceAdjuster implements ScheduledNudgePreferenceStep {
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

  adjust(item: ScheduledNudgePreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledNudgePreferenceAdjuster implements ScheduledNudgePreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledNudgePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredScheduledNudgePreferenceAdjuster implements ScheduledNudgePreferenceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledNudgePreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingScheduledNudgePreferenceAdjuster implements ScheduledNudgePreferenceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledNudgePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled nudge preference steps in order and keeps a trace of each. */
export class ScheduledNudgePreferenceEngine {
  steps: ScheduledNudgePreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledNudgePreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledNudgePreference): number {
    let current = item.netVolume();
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

  evaluateAll(items: ScheduledNudgePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledNudgePreferenceEngine(flagsValue: flags.Registry): ScheduledNudgePreferenceEngine {
  return new ScheduledNudgePreferenceEngine(
    [
      new FlaggedScheduledNudgePreferenceAdjuster(flagsValue, "scheduled-nudge-preference-rolling", -2.7),
      new MinimumScheduledNudgePreferenceAdjuster(4.2),
      new TieredScheduledNudgePreferenceAdjuster([2709, 3348, 3711], [1.02, 1.14, 0.84]),
      new RoundingScheduledNudgePreferenceAdjuster(0.05),
    ],
    [],
    0.1,
    82270.9,
  );
}
