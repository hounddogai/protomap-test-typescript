import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveMacroPreference } from "./adaptive-macro-preference.js";

/** One step of the adaptive macro preference calculation. */
export interface AdaptiveMacroPreferenceAdjuster {
  describe(): string;
  adjust(item: AdaptiveMacroPreference, value: number): number;
}

export class CapAdaptiveMacroPreferenceAdjuster implements AdaptiveMacroPreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveMacroPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameAdaptiveMacroPreferenceAdjuster implements AdaptiveMacroPreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveMacroPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedAdaptiveMacroPreferenceAdjuster implements AdaptiveMacroPreferenceAdjuster {
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

  adjust(item: AdaptiveMacroPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveMacroPreferenceAdjuster implements AdaptiveMacroPreferenceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveMacroPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive macro preference steps in order and keeps a trace of each. */
export class AdaptiveMacroPreferenceEngine {
  steps: AdaptiveMacroPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveMacroPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveMacroPreference): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: AdaptiveMacroPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveMacroPreferenceEngine(flagsValue: flags.Registry): AdaptiveMacroPreferenceEngine {
  return new AdaptiveMacroPreferenceEngine(
    [
      new CapAdaptiveMacroPreferenceAdjuster(45867),
      new NameAdaptiveMacroPreferenceAdjuster(new Map<string, number>([["west", 1.28]])),
      new FlaggedAdaptiveMacroPreferenceAdjuster(flagsValue, "adaptive-macro-preference-strict", -3.1),
      new RoundingAdaptiveMacroPreferenceAdjuster(0.1),
    ],
    [],
    2.3,
    90361.8,
  );
}
