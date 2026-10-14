import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualEnrollmentPreference } from "./manual-enrollment-preference.js";

/** One step of the manual enrollment preference calculation. */
export interface ManualEnrollmentPreferenceStep {
  describe(): string;
  adjust(item: ManualEnrollmentPreference, value: number): number;
}

export class FlaggedManualEnrollmentPreferenceAdjuster implements ManualEnrollmentPreferenceStep {
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

  adjust(item: ManualEnrollmentPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualEnrollmentPreferenceAdjuster implements ManualEnrollmentPreferenceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualEnrollmentPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumManualEnrollmentPreferenceAdjuster implements ManualEnrollmentPreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualEnrollmentPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapManualEnrollmentPreferenceAdjuster implements ManualEnrollmentPreferenceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualEnrollmentPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the manual enrollment preference steps in order and keeps a trace of each. */
export class ManualEnrollmentPreferenceEngine {
  steps: ManualEnrollmentPreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualEnrollmentPreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualEnrollmentPreference): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ManualEnrollmentPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualEnrollmentPreferenceEngine(flagsValue: flags.Registry): ManualEnrollmentPreferenceEngine {
  return new ManualEnrollmentPreferenceEngine(
    [
      new FlaggedManualEnrollmentPreferenceAdjuster(flagsValue, "manual-enrollment-preference-tiered", -3.8),
      new TieredManualEnrollmentPreferenceAdjuster([212, 653, 868], [1.16, 1.04, 1.11]),
      new MinimumManualEnrollmentPreferenceAdjuster(48.5),
      new CapManualEnrollmentPreferenceAdjuster(38272),
    ],
    [],
    2.6,
    29166.1,
  );
}
