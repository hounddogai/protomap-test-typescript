import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PreferenceTarget } from "./preference-target.js";

/** One step of the preference target calculation. */
export interface PreferenceTargetModifier {
  describe(): string;
  adjust(item: PreferenceTarget, value: number): number;
}

export class RoundingPreferenceTargetAdjuster implements PreferenceTargetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPreferenceTargetAdjuster implements PreferenceTargetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPreferenceTargetAdjuster implements PreferenceTargetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPreferenceTargetAdjuster implements PreferenceTargetModifier {
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

  adjust(item: PreferenceTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPreferenceTargetAdjuster implements PreferenceTargetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PreferenceTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the preference target steps in order and keeps a trace of each. */
export class PreferenceTargetEngine {
  steps: PreferenceTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PreferenceTarget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PreferenceTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPreferenceTargetEngine(flagsValue: flags.Registry): PreferenceTargetEngine {
  return new PreferenceTargetEngine(
    [
      new RoundingPreferenceTargetAdjuster(0.25),
      new PercentPreferenceTargetAdjuster(9.7),
      new MinimumPreferenceTargetAdjuster(1.5),
      new FlaggedPreferenceTargetAdjuster(flagsValue, "preference-target-weighted", 9.7),
      new CapPreferenceTargetAdjuster(36628),
    ],
    [],
    3.3,
    33502.8,
  );
}
