import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentPreference } from "./enrollment-preference.js";

/** One step of the enrollment preference calculation. */
export interface EnrollmentPreferenceAdjuster {
  describe(): string;
  adjust(item: EnrollmentPreference, value: number): number;
}

export class CapEnrollmentPreferenceAdjuster implements EnrollmentPreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EnrollmentPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedEnrollmentPreferenceAdjuster implements EnrollmentPreferenceAdjuster {
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

  adjust(item: EnrollmentPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentEnrollmentPreferenceAdjuster implements EnrollmentPreferenceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the enrollment preference steps in order and keeps a trace of each. */
export class EnrollmentPreferenceEngine {
  steps: EnrollmentPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: EnrollmentPreference): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: EnrollmentPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultEnrollmentPreferenceEngine(flagsValue: flags.Registry): EnrollmentPreferenceEngine {
  return new EnrollmentPreferenceEngine(
    [
      new CapEnrollmentPreferenceAdjuster(901),
      new FlaggedEnrollmentPreferenceAdjuster(flagsValue, "enrollment-preference-capped", -6),
      new PercentEnrollmentPreferenceAdjuster(23.4),
    ],
    [],
    1.8,
    94421,
  );
}
