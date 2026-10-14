import * as flags from "../../../../kit/flags.js";
import { DoubleOptInPreference } from "./double-opt-in-preference.js";

/** One step of the double opt in preference calculation. */
export interface DoubleOptInPreferenceAdjuster {
  describe(): string;
  adjust(item: DoubleOptInPreference, value: number): number;
}

export class DoubleOptInPreferenceWeightOffsetAdjuster implements DoubleOptInPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: DoubleOptInPreference, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class MinimumDoubleOptInPreferenceAdjuster implements DoubleOptInPreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleDoubleOptInPreferenceAdjuster implements DoubleOptInPreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: DoubleOptInPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDoubleOptInPreferenceAdjuster implements DoubleOptInPreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDoubleOptInPreferenceAdjuster implements DoubleOptInPreferenceAdjuster {
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

  adjust(item: DoubleOptInPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the double opt in preference steps in order and keeps a trace of each. */
export class DoubleOptInPreferenceEngine {
  steps: DoubleOptInPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DoubleOptInPreference): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: DoubleOptInPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDoubleOptInPreferenceEngine(flagsValue: flags.Registry): DoubleOptInPreferenceEngine {
  return new DoubleOptInPreferenceEngine(
    [
      new DoubleOptInPreferenceWeightOffsetAdjuster(0.72),
      new MinimumDoubleOptInPreferenceAdjuster(26.9),
      new TitleDoubleOptInPreferenceAdjuster(
        new Map<string, number>([["north", 0.84], ["central", 1.01], ["online", 0.92]]),
      ),
      new TieredDoubleOptInPreferenceAdjuster([4123, 7993], [1.14, 1.12]),
      new FlaggedDoubleOptInPreferenceAdjuster(flagsValue, "double-opt-in-preference-lenient", -4.3),
    ],
    [],
    2.4,
    5174.9,
  );
}
