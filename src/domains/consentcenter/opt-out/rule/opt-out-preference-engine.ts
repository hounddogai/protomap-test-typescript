import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutPreference } from "./opt-out-preference.js";

/** One step of the opt out preference calculation. */
export interface OptOutPreferenceStep {
  describe(): string;
  adjust(item: OptOutPreference, value: number): number;
}

export class PercentOptOutPreferenceAdjuster implements OptOutPreferenceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumOptOutPreferenceAdjuster implements OptOutPreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingOptOutPreferenceAdjuster implements OptOutPreferenceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedOptOutPreferenceAdjuster implements OptOutPreferenceStep {
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

  adjust(item: OptOutPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the opt out preference steps in order and keeps a trace of each. */
export class OptOutPreferenceEngine {
  steps: OptOutPreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutPreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: OptOutPreference): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: OptOutPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultOptOutPreferenceEngine(flagsValue: flags.Registry): OptOutPreferenceEngine {
  return new OptOutPreferenceEngine(
    [
      new PercentOptOutPreferenceAdjuster(8.5),
      new MinimumOptOutPreferenceAdjuster(36.8),
      new RoundingOptOutPreferenceAdjuster(0.1),
      new FlaggedOptOutPreferenceAdjuster(flagsValue, "opt-out-preference-legacy", -8.6),
    ],
    [],
    2.3,
    49470.6,
  );
}
